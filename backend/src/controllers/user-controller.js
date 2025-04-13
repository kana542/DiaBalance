import bcrypt from "bcryptjs";
import { registerUser, updateMyProfile } from "../models/user-model.js";

import {
  createValidationError,
  createDatabaseError,
  createResponse,
  Severity
} from "../middlewares/error-handler.js";

const register = async (req, res, next) => {
  try {
    const { kayttajanimi, salasana, email, kayttajarooli } = req.body;

    if (!kayttajanimi || !salasana) {
      return next(createValidationError("Käyttäjänimi ja salasana vaaditaan"));
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
    res.status(201).json(createResponse(
      { id: userId },
      `Käyttäjä luotu, id: ${userId}`,
      Severity.SUCCESS
    ));
  } catch (error) {
    next(createDatabaseError("Käyttäjän rekisteröinti epäonnistui", error));
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
      return next(createValidationError(result.error));
    }

    res.json(createResponse(
      { affectedRows: result.affectedRows || 1 },
      result.message || "Tiedot päivitetty onnistuneesti",
      Severity.SUCCESS
    ));
  } catch (error) {
    next(createDatabaseError("Tietojen päivittäminen epäonnistui", error));
  }
};

export { register, updateMe };
