/**
 * kubios-auth-controller.js - autentikointi ja tokenin hallinta Kubios-järjestelmän kanssa
 * -------------------
 * Käsittelee kirjautumisen Kubios API:in ja tokenien käsittelyn (idToken), sekä käyttäjätietojen yhdistämisen paikalliseen käyttäjään.
 *
 * pääominaisuudet:
 *    1. Kubios Cloud API -integraatio käyttäjien autentikaatioon
 *    2. tokenien hallinta ja tallennus tietokantaan myöhempää käyttöä varten
 *    3. käyttäjätietojen vastaanotto ja käsittely Kubios-järjestelmästä
 *    4. paikallisen ja Kubios-käyttäjätietojen yhdistäminen yhtenäisen autentikaation tarjoamiseksi
 *
 * keskeiset toiminnot:
 *    - kubiosLogin() - autentikoi käyttäjän Kubios-palveluun ja hankkii idTokenin
 *    - kubiosUserInfo() - noutaa käyttäjätiedot Kubios API:sta
 *    - postLogin() - käsittelee kirjautumispyynnön ja luo JWT-tokenin Kubios-tokenilla
 *    - getKubiosMe() - palauttaa kirjautuneen käyttäjän tiedot ja Kubios-tokenin
 *
 * käyttö sovelluksessa:
 *    - mahdollistaa HRV-datan hakemisen ja käsittelyn auth-controller.js:n kautta
 *    - tarjoaa rajapinnan kubios-controller.js:lle HRV-datan käsittelyyn
 *    - yhdistää Diabalance-käyttäjät Kubios-käyttäjiin saumattoman käyttökokemuksen tarjoamiseksi
 */

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { v4 } from 'uuid';
import promisePool from '../utils/database.js';

import {
  createAuthenticationError,
  createNotFoundError,
  createExternalApiError,
  createResponse,
  Severity
} from '../middlewares/error-handler.js';
import logger from "../utils/logger.js"

const baseUrl = process.env.KUBIOS_API_URI;

/**
 * etsii käyttäjän tietokannasta sähköpostin tai käyttäjänimen perusteella
 * @param {string} emailOrUsername - käyttäjän sähköpostiosoite tai käyttäjänimi
 * @returns {Object|null} käyttäjän tiedot objektina tai null jos käyttäjää ei löydy
 */
const findUserByEmailOrUsername = async (emailOrUsername) => {
  try {
    // tarkistetaan onko kyseessä sähköpostiosoite (sisältää @-merkin)
    const isEmail = emailOrUsername.includes('@');

    // haetaan käyttäjä joko sähköpostin tai käyttäjänimen perusteella
    const [rows] = await promisePool.query(
      isEmail
        ? 'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE email = ?' : 'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?',
      [emailOrUsername]
    );

    // jos haku oli sähköpostilla eikä käyttäjää löytynyt, yritetään vielä käyttäjänimellä
    if (isEmail && rows.length === 0) {
      logger.debug(`No user found with email ${emailOrUsername}, trying username lookup`);
      const [usernameRows] = await promisePool.query(
        'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?',
        [emailOrUsername]
      );

      // jos löytyy käyttäjänimellä, palautetaan se
      if (usernameRows.length > 0) {
        logger.debug(`Found user by username: ${emailOrUsername}`);
        return usernameRows[0];
      }
    }

    // jos käyttäjää ei löytynyt, palautetaan null
    if (rows.length === 0) {
      logger.debug(`No user found with ${isEmail ? 'email' : 'username'} ${emailOrUsername}`);
      return null;
    }

    // käyttäjä löytyi, lokitetaan ja palautetaan käyttäjätiedot
    logger.debug(`Found user by ${isEmail ? 'email' : 'username'}: ${emailOrUsername}`);
    return rows[0];
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja palautetaan null
    logger.error('Error finding user', error);
    return null;
  }
};

/**
 * kirjautuu Kubios-palveluun käyttäjänimellä ja salasanalla
 * @param {string} username - käyttäjän tunnus tai sähköpostiosoite Kubios-palveluun
 * @param {string} password - käyttäjän salasana Kubios-palveluun
 * @returns {Object} kirjautumistiedot objektina
 *   @returns {string} idToken - Kubios API:n autentikointitoken
 *   @returns {number} expiresIn - tokenin voimassaoloaika sekunteina (tyypillisesti 3600s)
 * @throws {Error} virhe jos kirjautuminen epäonnistuu (väärät tunnukset tai palvelimeen ei saada yhteyttä)
 */
const kubiosLogin = async (username, password) => {
  // luodaan CSRF-token suojaamaan pyyntöä
  const csrf = v4();
  const headers = new Headers();
  headers.append('Cookie', `XSRF-TOKEN=${csrf}`);
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);

  // valmistellaan kirjautumistiedot lomakemuodossa
  const searchParams = new URLSearchParams();
  searchParams.set('username', username);
  searchParams.set('password', password);
  searchParams.set('client_id', process.env.KUBIOS_CLIENT_ID);
  searchParams.set('redirect_uri', process.env.KUBIOS_REDIRECT_URI);
  searchParams.set('response_type', 'token');
  searchParams.set('scope', 'openid');
  searchParams.set('_csrf', csrf);

  // määritellään pyynnön asetukset
  const options = {
    method: 'POST',
    headers: headers,
    redirect: 'manual', // estetään automaattinen uudelleenohjaus, jottei kaapata tokenia ig (t. claude)
    body: searchParams,
  };

  try {
    // lähetetään kirjautumispyyntö Kubios-palveluun
    const response = await fetch(process.env.KUBIOS_LOGIN_URL, options);

    // tarkistetaan onnistuiko pyyntö
    if (!response.ok && !response.headers.has('location')) {
      logger.error(`Kubios login failed with status: ${response.status}`);
      throw createAuthenticationError('Virheellinen käyttäjänimi tai salasana (Kubios)');
    }

    // onnistunut kirjautuminen aiheuttaa uudelleenohjauksen, jonka osoitteesta saadaan token
    const location = response.headers.get('location');

    // tarkistetaan virheellinen kirjautumistilanne
    if (location.includes('login?null')) {
      logger.error('Kubios login failed - login?null in location');
      throw createAuthenticationError('Virheellinen käyttäjänimi tai salasana (Kubios)');
    }

    // parsitaan token uudelleenohjausosoitteesta
    const regex = /id_token=(.*)&access_token=(.*)&expires_in=(.*)/;
    const match = location.match(regex);

    // varmistetaan että token löytyi
    if (!match || !match[1]) {
      logger.error(`Could not extract token from location: ${location}`);
      throw createExternalApiError('Virhe Kubios-kirjautumisessa: tokenia ei löytynyt');
    }

    // poimitaan token ja sen voimassaoloaika
    const idToken = match[1];
    const expiresIn = match[3] || 3600;

    logger.info(`Kubios login successful for user. Token expires in ${expiresIn} seconds`);
    return { idToken, expiresIn };
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja heitetään poikkeus eteenpäin
    logger.error('Kubios login error', error);
    if (error.status) throw error;
    throw createExternalApiError('Virhe Kubios-kirjautumisessa');
  }
};

/**
 * hakee käyttäjän perustiedot Kubios API -palvelusta
 * @param {string} idToken - Kubios-palvelun autentikointitoken
 * @returns {Object} käyttäjän tiedot objektina, sisältäen mm. nimen, sähköpostin ja demografisia tietoja
 * @throws {Error} virhe jos tietojen haku epäonnistuu (virheellinen token tai palvelinyhteysongelma)
 */
const kubiosUserInfo = async (idToken) => {
  logger.debug('Getting user info from Kubios API');
  // määritellään HTTP-pyynnön otsikkotiedot
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', idToken);

  try {
    // lähetetään pyyntö Kubios API:n käyttäjätietojen päätepisteeseen
    const response = await fetch(baseUrl + '/user/self', {
      method: 'GET',
      headers: headers,
    });

    // tarkistetaan onnistuiko pyyntö
    if (!response.ok) {
      logger.error(`Kubios user info request failed with status: ${response.status}`);
      throw createExternalApiError('Kubios-käyttäjätietojen haku epäonnistui');
    }

    // parsitaan vastaus JSON-muotoon
    const responseJson = await response.json();

    // tarkistetaan vastauksen tila
    if (responseJson.status === 'ok') {
      logger.debug('Successfully retrieved Kubios user info');
      return responseJson.user; // palautetaan käyttäjätiedot
    } else {
      // vastaus ei ole ok-tilassa, heitetään virhe
      logger.error('Kubios API returned error', responseJson);
      throw createExternalApiError('Kubios-käyttäjätietojen haku epäonnistui');
    }
  } catch (error) {
    // virhetilanteiden käsittely
    logger.error('Error fetching Kubios user info', error);
    if (error.status) throw error;
    throw createExternalApiError('Virhe Kubios-käyttäjätietojen haussa');
  }
};

/**
 * käsittelee käyttäjän kirjautumisen Kubios API -palveluun ja luo JWT-tokenin
 * @param {Request} req - HTTP-pyyntöobjekti, jossa käyttäjän kirjautumistiedot
 * @param {string} req.body.kayttajanimi - käyttäjän tunnus tai sähköpostiosoite
 * @param {string} req.body.salasana - käyttäjän salasana
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Object} HTTP-vastaus, joka sisältää JWT-tokenin ja käyttäjätiedot
 */
const postLogin = async (req, res, next) => {
  const { kayttajanimi, salasana } = req.body;

  try {
    logger.info(`Processing Kubios login for user: ${kayttajanimi}`);

    // tarkistetaan ensin löytyykö käyttäjä omasta tietokannasta
    logger.debug(`Finding user by email or username: ${kayttajanimi}`);
    const localUser = await findUserByEmailOrUsername(kayttajanimi);

    // jos käyttäjää ei löydy, palautetaan virhe
    if (!localUser) {
      return next(createNotFoundError(`Käyttäjää ei löydy järjestelmästä. Varmista, että sähköpostiosoite tai käyttäjänimi on oikein.`));
    }

    logger.debug(`Found local user with ID ${localUser.kayttaja_id} and username ${localUser.kayttajanimi}`);

    // kirjaudutaan Kubios API -palveluun käyttäjän tunnuksilla
    const { idToken } = await kubiosLogin(kayttajanimi, salasana);

    // haetaan käyttäjän perustiedot Kubios-palvelusta (valinnainen - käytetään lokitukseen)
    const kubiosUser = await kubiosUserInfo(idToken);
    logger.debug(`Kubios user info: ${kubiosUser.email}`);

    // luodaan JWT-token, joka sisältää Kubios-tokenin
    const token = jwt.sign(
      {
        kayttaja_id: localUser.kayttaja_id,
        kubiosIdToken: idToken,
        kayttajarooli: localUser.kayttajarooli
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    logger.info(`Kubios login successful for user ID: ${localUser.kayttaja_id}`);

    // poistetaan salasana ennen käyttäjätietojen palauttamista
    delete localUser.salasana;

    // palautetaan token ja käyttäjätiedot onnistumisviestin kanssa
    res.json(createResponse({
      token,
      user: localUser
    }, 'Kirjautuminen onnistui (Kubios)', Severity.SUCCESS));
  } catch (err) {
    // virhetilanteessa lokitetaan virhe ja siirretään se keskitetylle käsittelijälle
    logger.error('Error in Kubios login process', err);
    next(createExternalApiError('Kirjautuminen Kubios API:in epäonnistui', err));
  }
};

/**
 * hakee kirjautuneen käyttäjän tiedot ja Kubios-tokenin
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää käyttäjän tunnistetiedot
 * @param {Object} req.user - autentikoitu käyttäjä JWT-tokenista
 * @param {number} req.user.kayttaja_id - käyttäjän ID tietokannassa
 * @param {string} req.user.kubiosIdToken - Kubios API:n autentikointitoken
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Object} JSON-vastaus, joka sisältää käyttäjätiedot ja Kubios-tokenin
 */
const getKubiosMe = async (req, res, next) => {
  try {
    // haetaan käyttäjän perustiedot tietokannasta (ilman salasanaa)
    const [rows] = await promisePool.query(
      'SELECT kayttaja_id, kayttajanimi, email, kayttajarooli FROM kayttaja WHERE kayttaja_id = ?',
      [req.user.kayttaja_id]
    );

    // tarkistetaan löytyikö käyttäjä
    if (rows.length === 0) {
      return next(createNotFoundError('Käyttäjää ei löytynyt'));
    }

    // palautetaan käyttäjätiedot ja Kubios-token
    res.json(createResponse({
      user: rows[0],
      kubios_token: req.user.kubiosIdToken
    }, 'Käyttäjätiedot haettu', Severity.SUCCESS));
  } catch (err) {
    // virhetilanteessa siirretään virhe keskitetylle käsittelijälle
    next(createDatabaseError("Käyttäjätietojen hakeminen epäonnistui", err));
  }
};

export { postLogin, getKubiosMe, kubiosLogin };
