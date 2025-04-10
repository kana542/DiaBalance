import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginUser, getMyProfile, updateKubiosToken, removeKubiosToken } from "../models/user-model.js";
import { customError } from "../middlewares/error-handler.js";
import { kubiosLogin } from "../controllers/kubios-auth-controller.js";

const login = async (req, res, next) => {
  try {
    const { kayttajanimi, salasana } = req.body;

    if (!kayttajanimi || !salasana) {
      return next(customError("Käyttäjänimi ja salasana vaaditaan", 400));
    }

    const user = await loginUser(kayttajanimi);

    if (!user) {
      return next(customError("Virheellinen käyttäjätunnus", 401));
    }

    const match = await bcrypt.compare(salasana, user.salasana);

    if (!match) {
      return next(customError("Virheellinen salasana", 401));
    }

    const token = jwt.sign(
      {
        kayttaja_id: user.kayttaja_id,
        kayttajarooli: user.kayttajarooli,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    delete user.salasana;

    // Yritä Kubios-kirjautumista käyttäen käyttäjän sähköpostia
    let kubiosStatus = {
      success: false,
      message: "Kubios-kirjautumista ei yritetty"
    };

    try {
      if (user.email) {
        console.log("Attempting Kubios login for email:", user.email);
        const { idToken, expiresIn } = await kubiosLogin(user.email, salasana);

        // Tallenna token tietokantaan
        await updateKubiosToken(user.kayttaja_id, idToken, expiresIn);

        kubiosStatus = {
          success: true,
          message: "Kubios-kirjautuminen onnistui"
        };

        console.log("Kubios login successful for user ID:", user.kayttaja_id);
      } else {
        console.log("Cannot attempt Kubios login - no email for user:", kayttajanimi);
        kubiosStatus = {
          success: false,
          message: "Käyttäjällä ei ole sähköpostiosoitetta Kubios-kirjautumista varten"
        };
      }
    } catch (kubiosError) {
      console.error("Kubios login error:", kubiosError);
      kubiosStatus = {
        success: false,
        message: kubiosError.message || "Kubios-kirjautuminen epäonnistui"
      };
    }

    res.json({
      message: "Kirjautuminen onnistui",
      token,
      user,
      kubios: kubiosStatus
    });
  } catch (error) {
    next(customError(error.message, 400));
  }
};

const logout = async (req, res, next) => {
  try {
    // Tarkista että kayttaja_id on olemassa
    const userId = req.user?.kayttaja_id;

    if (!userId) {
      return next(customError("Käyttäjän ID puuttuu", 400));
    }

    console.log(`Logging out user ID: ${userId}, removing Kubios token`);

    // Poista Kubios token ja logita toimenpide
    const result = await removeKubiosToken(userId);

    console.log(`Logout result for user ${userId}:`, result);

    res.json({
      message: "Uloskirjautuminen onnistui",
      tokenRemoved: result
    });
  } catch (error) {
    console.error("Logout error:", error);
    next(customError(error.message || "Uloskirjautuminen epäonnistui", 400));
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.kayttaja_id);

    if (!user) {
      return next(customError("Käyttäjää ei löytynyt", 404));
    }

    res.json(user);
  } catch (error) {
    next(customError(error.message, 400));
  }
};

const validateToken = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.kayttaja_id);

    if (!user) {
      return next(customError("Käyttäjää ei löytynyt", 404));
    }

    res.json({
      valid: true,
      user,
    });
  } catch (error) {
    next(customError(error.message, 400));
  }
};

export { login, logout, getMe, validateToken };
