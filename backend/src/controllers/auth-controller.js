import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginUser, getMyProfile, updateKubiosToken, removeKubiosToken } from "../models/user-model.js";
import {
  createResponse,
  createAuthenticationError,
  createValidationError,
  createNotFoundError,
  createDatabaseError,
  Severity
} from "../middlewares/error-handler.js";
import { kubiosLogin } from "../controllers/kubios-auth-controller.js";

const login = async (req, res, next) => {
  try {
    const { kayttajanimi, salasana } = req.body;

    if (!kayttajanimi || !salasana) {
      return next(createValidationError("Käyttäjänimi ja salasana vaaditaan"));
    }

    const user = await loginUser(kayttajanimi);

    if (!user) {
      return next(createAuthenticationError("Virheellinen käyttäjätunnus"));
    }

    const match = await bcrypt.compare(salasana, user.salasana);

    if (!match) {
      return next(createAuthenticationError("Virheellinen salasana"));
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

    res.json(createResponse({
      token,
      user,
      kubios: kubiosStatus
    }, "Kirjautuminen onnistui", Severity.SUCCESS));
  } catch (error) {
    next(createDatabaseError("Kirjautuminen epäonnistui", error));
  }
};

const logout = async (req, res, next) => {
  try {
    // Tarkista että kayttaja_id on olemassa
    const userId = req.user?.kayttaja_id;

    if (!userId) {
      return next(createValidationError("Käyttäjän ID puuttuu"));
    }

    console.log(`Logging out user ID: ${userId}, removing Kubios token`);

    // Poista Kubios token ja logita toimenpide
    const result = await removeKubiosToken(userId);

    console.log(`Logout result for user ${userId}:`, result);

    res.json(createResponse({
      tokenRemoved: result
    }, "Uloskirjautuminen onnistui", Severity.SUCCESS));
  } catch (error) {
    console.error("Logout error:", error);
    next(createDatabaseError("Uloskirjautuminen epäonnistui", error));
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.kayttaja_id);

    if (!user) {
      return next(createNotFoundError("Käyttäjää ei löytynyt"));
    }

    res.json(createResponse(user, "Käyttäjätiedot haettu", Severity.SUCCESS));
  } catch (error) {
    next(createDatabaseError("Käyttäjätietojen hakeminen epäonnistui", error));
  }
};

const validateToken = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.kayttaja_id);

    if (!user) {
      return next(createNotFoundError("Käyttäjää ei löytynyt"));
    }

    res.json(createResponse({
      valid: true,
      user
    }, "Token on voimassa", Severity.SUCCESS));
  } catch (error) {
    next(createDatabaseError("Tokenin validointi epäonnistui", error));
  }
};

export { login, logout, getMe, validateToken };
