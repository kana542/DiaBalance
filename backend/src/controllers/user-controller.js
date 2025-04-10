import bcrypt from "bcryptjs";
import { registerUser, updateMyProfile } from "../models/user-model.js";
import { customError } from "../middlewares/error-handler.js";

const register = async (req, res, next) => {
  try {
    const { kayttajanimi, salasana, email, kayttajarooli } = req.body;

    if (!kayttajanimi || !salasana) {
      return next(customError("Käyttäjänimi ja salasana vaaditaan", 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(salasana, salt);

    const newUser = {
      kayttajanimi,
      email,  // Sähköpostiosoite
      salasana: hashedPassword,
      kayttajarooli: kayttajarooli || 0,
    };

    const userId = await registerUser(newUser);
    res.status(201).json({ message: `Käyttäjä luotu, id: ${userId}` });
  } catch (error) {
    next(customError(error.message, 400));
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { kayttajanimi, salasana, email } = req.body;
    const data = {};

    if (kayttajanimi) data.kayttajanimi = kayttajanimi;
    if (email) data.email = email;
    if (salasana) {
      const salt = await bcrypt.genSalt(10);
      data.salasana = await bcrypt.hash(salasana, salt);
    }

    const result = await updateMyProfile(req.user.kayttaja_id, data);

    if (result.error) {
      return next(customError(result.error, 400));
    }

    res.json({ message: result.message });
  } catch (error) {
    next(customError(error.message, 400));
  }
};

export { register, updateMe };
