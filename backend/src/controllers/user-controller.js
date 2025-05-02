/**
 * user-controller.js - käyttäjätietojen hallintaan liittyvät controller-toiminnot
 * -------------------
 * sisältää rekisteröinti- ja profiilin päivitystoiminnot.
 * mahdollistaa käyttäjätilien luomisen ja ylläpidon sovelluksessa.
 *
 * pääominaisuudet:
 *    1. käyttäjien rekisteröinti tietokantaan bcrypt-salauksella
 *    2. käyttäjätietojen validointi ja duplikaattien tarkistus
 *    3. käyttäjäprofiilin päivitys ja olemassa olevien tietojen tarkistus
 *    4. tietoturvallinen salasanojen käsittely ja validointi
 *
 * keskeiset toiminnot:
 *    - register() - rekisteröi uuden käyttäjän tietokantaan
 *    - updateMe() - päivittää kirjautuneen käyttäjän profiilitiedot
 *    - checkExistingUserData() - tarkistaa onko käyttäjänimi tai sähköposti jo käytössä
 *    - hashPassword() - salaa käyttäjän salasanan turvallisesti
 *
 * käyttö sovelluksessa:
 *    - kutsutaan auth-router.js ja user-router.js -tiedostojen kautta käyttäjähallinnan toimenpiteisiin
 *    - vastaa turvallisesta käyttäjärekisteröinnistä ja profiilin ylläpidosta
 *    - mahdollistaa käyttäjäkohtaisen tiedon tallentamisen ja käsittelyn
 */

import bcrypt from "bcryptjs";
import { registerUser, updateMyProfile } from "../models/user-model.js";

import {
  createValidationError,
  createDatabaseError,
  createResponse,
  Severity,
} from "../middlewares/error-handler.js";
import promisePool from "../utils/database.js";
import logger from "../utils/logger.js"

/**
 * Tarkistaa, onko käyttäjätunnus tai sähköposti jo käytössä
 * @param {string} kayttajanimi - Käyttäjänimi
 * @param {string} email - Sähköposti
 * @param {number|null} currentUserId - Nykyisen käyttäjän ID (päivityksiä varten)
 * @returns {Array} Virheiden lista
 */
const checkExistingUserData = async (kayttajanimi, email, currentUserId = null) => {
  const errors = [];

  // Tarkistuskyselyssä huomioidaan currentUserId, jos se on annettu
  const userIdCondition = currentUserId ? `AND kayttaja_id != ${currentUserId}` : '';

  if (kayttajanimi) {
    const [userWithSameUsername] = await promisePool.query(
      `SELECT kayttaja_id FROM kayttaja WHERE kayttajanimi = ? ${userIdCondition}`,
      [kayttajanimi]
    );

    if (userWithSameUsername.length > 0) {
      errors.push({
        field: "kayttajanimi",
        message: "Käyttäjänimi on jo käytössä",
      });
    }
  }

  if (email) {
    const [userWithSameEmail] = await promisePool.query(
      `SELECT kayttaja_id FROM kayttaja WHERE email = ? ${userIdCondition}`,
      [email]
    );

    if (userWithSameEmail.length > 0) {
      errors.push({
        field: "email",
        message: "Sähköposti on jo käytössä"
      });
    }
  }

  return errors;
};

/**
 * Salaa salasanan bcrypt-kirjastolla
 * @param {string} password - Salaamaton salasana
 * @returns {Promise<string>} Salattu salasana
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Rekisteröi uuden käyttäjän tietokantaan
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

    // Tarkista ettei käyttäjänimi tai sähköposti ole jo käytössä
    const errors = await checkExistingUserData(kayttajanimi, email);

    if (errors.length > 0) {
      return next(createValidationError("Rekisteröinti epäonnistui", errors));
    }

    // Salaa salasana
    const hashedPassword = await hashPassword(salasana);

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
 * Päivittää käyttäjän tietoja
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

    // Tarkista onko uusi käyttäjänimi tai email jo jonkun toisen käytössä
    const errors = await checkExistingUserData(kayttajanimi, email, kayttajaId);

    if (errors.length > 0) {
      return next(createValidationError("Tietojen päivitys epäonnistui", errors));
    }

    // Lisää päivitettävät tiedot data-objektiin
    if (kayttajanimi) data.kayttajanimi = kayttajanimi;
    if (email) data.email = email;

    // Salaa salasana jos se on mukana
    if (salasana) {
      data.salasana = await hashPassword(salasana);
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
