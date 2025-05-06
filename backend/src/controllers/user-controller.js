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
 * tarkistaa onko käyttäjänimi tai sähköposti jo käytössä tietokannassa
 * @param {string} kayttajanimi - tarkistettava käyttäjänimi
 * @param {string} email - tarkistettava sähköpostiosoite
 * @param {number|null} currentUserId - nykyisen käyttäjän ID päivitystilanteissa (jotta käyttäjä voi säilyttää oman käyttäjänimensä)
 * @returns {Array} virheobjektien lista, tyhjä jos ei konflikteja
 */
const checkExistingUserData = async (kayttajanimi, email, currentUserId = null) => {
  // alustetaan virhelista
  const errors = [];

  // lisätään SQL-ehtoon käyttäjän ID:n poissulkeminen jos sitä ollaan päivittämässä
  const userIdCondition = currentUserId ? `AND kayttaja_id != ${currentUserId}` : '';

  // tarkistetaan käyttäjänimen saatavuus jos se on annettu
  if (kayttajanimi) {
    const [userWithSameUsername] = await promisePool.query(
      `SELECT kayttaja_id FROM kayttaja WHERE kayttajanimi = ? ${userIdCondition}`,
      [kayttajanimi]
    );

    // jos käyttäjänimi on jo käytössä toisella käyttäjällä, lisätään virhe
    if (userWithSameUsername.length > 0) {
      errors.push({
        field: "kayttajanimi",
        message: "Käyttäjänimi on jo käytössä",
      });
    }
  }

  // tarkistetaan sähköpostin saatavuus jos se on annettu
  if (email) {
    const [userWithSameEmail] = await promisePool.query(
      `SELECT kayttaja_id FROM kayttaja WHERE email = ? ${userIdCondition}`,
      [email]
    );

    // jos sähköposti on jo käytössä toisella käyttäjällä, lisätään virhe
    if (userWithSameEmail.length > 0) {
      errors.push({
        field: "email",
        message: "Sähköposti on jo käytössä"
      });
    }
  }

  // palautetaan mahdolliset virheet kutsujalle
  return errors;
};

// salasanan salaus bcrypt-kirjastolla
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * käsittelee uuden käyttäjän rekisteröinnin
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää käyttäjätiedot (body)
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {JSON} HTTP-vastaus, joka sisältää uuden käyttäjän ID:n tai virheilmoituksen
 */
const register = async (req, res, next) => {
  try {
    // haetaan käyttäjätiedot pyynnön rungosta
    const { kayttajanimi, salasana, email, kayttajarooli } = req.body;

    // varmistetaan että pakolliset kentät on annettu
    if (!kayttajanimi || !salasana) {
      return next(createValidationError("Käyttäjänimi ja salasana vaaditaan"));
    }

    // tarkistetaan että käyttäjänimi ja sähköposti ovat uniikkeja
    const errors = await checkExistingUserData(kayttajanimi, email);

    // jos tarkistuksessa löytyi virheitä, palautetaan ne validointivirheinä
    if (errors.length > 0) {
      return next(createValidationError("Rekisteröinti epäonnistui", errors));
    }

    // salataan salasana turvallisesti ennen tallennusta
    const hashedPassword = await hashPassword(salasana);

    // kootaan käyttäjäobjekti tallennusta varten
    const newUser = {
      kayttajanimi,
      email,
      salasana: hashedPassword,
      kayttajarooli: kayttajarooli || 0,
    };

    // tallennetaan käyttäjä tietokantaan
    const userId = await registerUser(newUser);

    // vastataan onnistuneesta rekisteröinnistä
    res
      .status(201) // Created
      .json(
        createResponse(
          { id: userId },
          `Käyttäjä luotu, id: ${userId}`,
          Severity.SUCCESS
        )
      );
  } catch (error) {
    // virhetilanteessa siirretään virhe keskitetylle käsittelijälle
    next(createDatabaseError("Käyttäjän rekisteröinti epäonnistui", error));
  }
};

/**
 * käsittelee käyttäjän profiilitietojen päivityksen
 * @param {Request} req - HTTP-pyyntöobjekti, sisältää päivitettävät tiedot ja käyttäjän tunnisteen
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {JSON} HTTP-vastaus, joka sisältää päivityksen tuloksen tai virheilmoituksen
 */
const updateMe = async (req, res, next) => {
  try {
    // haetaan käyttäjän ID autentikointitiedoista
    const kayttajaId = req.user.kayttaja_id;

    // poimitaan pyyntörungosta päivitettävät tiedot
    const { kayttajanimi, salasana, email } = req.body;
    const data = {};

    // tarkistetaan ettei käyttäjänimi tai sähköposti ole jo toisen käyttäjän käytössä
    const errors = await checkExistingUserData(kayttajanimi, email, kayttajaId);

    // jos tarkistuksessa löytyi virheitä, keskeytetään päivitys
    if (errors.length > 0) {
      return next(createValidationError("Tietojen päivitys epäonnistui", errors));
    }

    // lisätään vain annetut tiedot päivitysobjektiin
    if (kayttajanimi) data.kayttajanimi = kayttajanimi;
    if (email) data.email = email;

    // jos salasana annettu, salataan se ennen tallentamista
    if (salasana) {
      data.salasana = await hashPassword(salasana);
    }

    // päivitetään tiedot tietokantaan
    const result = await updateMyProfile(kayttajaId, data);

    // käsitellään mahdollinen virhetilanne (ei päivitettäviä kenttiä)
    if (result.error) {
      return next(createValidationError(result.error));
    }

    // vastataan onnistuneesta päivityksestä standardin mukaisella vastausobjektilla
    res.json(
      createResponse(
        { affectedRows: result.affectedRows || 1 },
        result.message || "Tiedot päivitetty onnistuneesti",
        Severity.SUCCESS
      )
    );
  } catch (error) {
    // virhetilanteessa siirretään virhe keskitetylle käsittelijälle
    next(createDatabaseError("Tietojen päivittäminen epäonnistui", error));
  }
};

export { register, updateMe };
