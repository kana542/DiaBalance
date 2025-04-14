// user-controller.js - käyttäjätietojen hallintaan liittyvät controller-toiminnot
// -------------------
// Sisältää rekisteröinti- ja profiilin päivitystoiminnot.
// Käytetään auth-router.js ja user-router.js -tiedostoissa.

import bcrypt from "bcryptjs";
import { registerUser, updateMyProfile } from "../models/user-model.js";

import {
  createValidationError,
  createDatabaseError,
  createResponse,
  Severity
} from "../middlewares/error-handler.js";


/**
 * 
 * @param {Request} req HTTP-pyyntö, joka sisältää käyttäjätiedot bodyssa
 * @param {Response} res HTTP-vastaus, joka palautetaan asiakkaalle
 * @param {function} next seurantaava middleware-funktio, jota kutsutaan seuraavaksi
 * @description Rekisteröi uuden käyttäjän tietokantaan
 * @returns {JSON} JSON-vastaus, joka sisältää uuden käyttäjän ID:n ja onnistumisviestin
 */
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
      email,  
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


/**
 * 
 * @param {Request} req HTTP-pyyntö, joka sisältää muutettavat tiedot
 * @param {Response} res HTTP-vastaus, joka palautetaan asiakkaalle
 * @param {Function} next seuraava middleware-funktio, jota kutsutaan seuraavaksi
 * @description Päivittää käyttäjän tietoja tietokannassa
 * @returns {JSON} JSON-vastaus, joka sisältää päivitetyt tiedot ja onnistumisviestin
 */
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
