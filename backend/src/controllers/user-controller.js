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
  Severity,
} from "../middlewares/error-handler.js";
import promisePool from "../utils/database.js";

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

    //Scrum-54: tarkista ettei käyttäjänimi tai sähköposti ole jo käytössä
    const [userWithSameUsername] = await promisePool.query(
      "SELECT kayttaja_id FROM kayttaja WHERE kayttajanimi = ?",
      [kayttajanimi]
    );

    const [userWithSameEmail] = await promisePool.query(
      "SELECT kayttaja_id FROM kayttaja WHERE email = ?",
      [email]
    );

    //Kerää virheet
    const errors = [];
    if (userWithSameUsername.length > 0) {
      errors.push({
        field: "kayttajanimi",
        message: "Käyttäjänimi on jo käytössä",
      });
    }
    if (userWithSameEmail.length > 0) {
      errors.push({ field: "email", message: "Sähköposti on jo käytössä" });
    }

    if (errors.length > 0) {
      return next(createValidationError("Rekisteröinti epäonnistui", errors));
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
    res
      .status(201)
      .json(
        createResponse(
          { id: userId },
          `Käyttäjä luotu, id: ${userId}`,
          Severity.SUCCESS
        )
      );
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
    const kayttajaId = req.user.kayttaja_id;
    const { kayttajanimi, salasana, email } = req.body;
    const data = {};

    //Tarkista onko uusi käyttäjänimi tai email jo jonkun toisen käytössä
    const errors = [];

    if (kayttajanimi) {
      const [sameUsername] = await promisePool.query(
        "SELECT kayttaja_id FROM kayttaja WHERE kayttajanimi = ? AND kayttaja_id != ?",
        [kayttajanimi, kayttajaId]
      );
      if (sameUsername.length > 0) {
        errors.push({
          field: "kayttajanimi",
          message: "Käyttäjänimi on jo käytössä",
        });
      } else {
        data.kayttajanimi = kayttajanimi;
      }
    }

    if (email) {
      const [sameEmail] = await promisePool.query(
        "SELECT kayttaja_id FROM kayttaja WHERE email = ? AND kayttaja_id != ?",
        [email, kayttajaId]
      );
      if (sameEmail.length > 0) {
        errors.push({ field: "email", message: "Sähköposti on jo käytössä" });
      } else {
        data.email = email;
      }
    }

    if (errors.length > 0) {
      return next(
        createValidationError("Tietojen päivitys epäonnistui", errors)
      );
    }

    if (salasana) {
      const salt = await bcrypt.genSalt(10);
      data.salasana = await bcrypt.hash(salasana, salt);
    }

    const result = await updateMyProfile(kayttajaId, data);

    if (result.error) {
      return next(createValidationError(result.error));
    }

    res.json(
      createResponse(
        { affectedRows: result.affectedRows || 1 },
        result.message || "Tiedot päivitetty onnistuneesti",
        Severity.SUCCESS
      )
    );
  } catch (error) {
    next(createDatabaseError("Tietojen päivittäminen epäonnistui", error));
  }
};

export { register, updateMe };
