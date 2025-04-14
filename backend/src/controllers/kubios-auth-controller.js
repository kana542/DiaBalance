// kubios-auth-controller.js - autentikointi ja tokenin hallinta Kubios-järjestelmän kanssa
// -------------------
// Käsittelee kirjautumisen Kubios API:in ja tokenien käsittelyn (idToken), sekä käyttäjätietojen yhdistämisen paikalliseen käyttäjään.

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

const baseUrl = process.env.KUBIOS_API_URI;

/**
 * * Etsii käyttäjän tietokannasta joko sähköpostin tai käyttäjätunnuksen perusteella.
 * * Jos sähköpostia ei löydy, yrittää käyttäjätunnusta.
 * @param {string} emailOrUsername 
 * @returns {object|null} käyttäjän tiedot tai null jos ei löydy
 */
const findUserByEmailOrUsername = async (emailOrUsername) => {
  try {
    // Check if this looks like an email
    const isEmail = emailOrUsername.includes('@');

    const [rows] = await promisePool.query(
      isEmail
        ? 'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE email = ?' : 'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?',
      [emailOrUsername]
    );

    // If we tried email and didn't find a match, try username as fallback
    if (isEmail && rows.length === 0) {
      console.log(`No user found with email ${emailOrUsername}, trying username lookup`);
      const [usernameRows] = await promisePool.query(
        'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?',
        [emailOrUsername]
      );

      if (usernameRows.length > 0) {
        console.log(`Found user by username: ${emailOrUsername}`);
        return usernameRows[0];
      }
    }

    if (rows.length === 0) {
      console.log(`No user found with ${isEmail ? 'email' : 'username'} ${emailOrUsername}`);
      return null;
    }

    console.log(`Found user by ${isEmail ? 'email' : 'username'}: ${emailOrUsername}`);
    return rows[0];
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

/**
 * 
 * @param {string} username Käyttäjätunnus tai sähköposti
 * @param {string} password salasana
 * @returns idToken ja expiresIn
 */
const kubiosLogin = async (username, password) => {
  console.log(`Attempting Kubios login for user: ${username}`);
  const csrf = v4();
  const headers = new Headers();
  headers.append('Cookie', `XSRF-TOKEN=${csrf}`);
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  const searchParams = new URLSearchParams();
  searchParams.set('username', username);
  searchParams.set('password', password);
  searchParams.set('client_id', process.env.KUBIOS_CLIENT_ID);
  searchParams.set('redirect_uri', process.env.KUBIOS_REDIRECT_URI);
  searchParams.set('response_type', 'token');
  searchParams.set('scope', 'openid');
  searchParams.set('_csrf', csrf);

  const options = {
    method: 'POST',
    headers: headers,
    redirect: 'manual',
    body: searchParams,
  };

  try {
    console.log('Sending request to Kubios login endpoint...');
    const response = await fetch(process.env.KUBIOS_LOGIN_URL, options);

    if (!response.ok && !response.headers.has('location')) {
      console.error('Kubios login failed with status:', response.status);
      throw createAuthenticationError('Virheellinen käyttäjänimi tai salasana (Kubios)');
    }

    const location = response.headers.get('location');
    console.log('Received redirect location from Kubios');

    if (location.includes('login?null')) {
      console.error('Kubios login failed - login?null in location');
      throw createAuthenticationError('Virheellinen käyttäjänimi tai salasana (Kubios)');
    }

    const regex = /id_token=(.*)&access_token=(.*)&expires_in=(.*)/;
    const match = location.match(regex);

    if (!match || !match[1]) {
      console.error('Could not extract token from location:', location);
      throw createExternalApiError('Virhe Kubios-kirjautumisessa: tokenia ei löytynyt');
    }

    const idToken = match[1];
    const expiresIn = match[3] || 3600;

    console.log(`Kubios login successful. Token expires in ${expiresIn} seconds`);
    return { idToken, expiresIn };
  } catch (error) {
    console.error('Kubios login error:', error);
    if (error.status) throw error;
    throw createExternalApiError('Virhe Kubios-kirjautumisessa');
  }
};

/**
 * Hakee käyttäjän tiedot Kubios API:sta
 * @description Hakee käyttäjän tiedot Kubios API:sta käyttäen idTokenia
 * @param {string} idToken Kubios idToken
 * @returns {object} Kubios käyttäjätiedot
 */
const kubiosUserInfo = async (idToken) => {
  console.log('Getting user info from Kubios API');
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', idToken);

  try {
    const response = await fetch(baseUrl + '/user/self', {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      console.error('Kubios user info request failed with status:', response.status);
      throw createExternalApiError('Kubios-käyttäjätietojen haku epäonnistui');
    }

    const responseJson = await response.json();

    if (responseJson.status === 'ok') {
      console.log('Successfully retrieved Kubios user info');
      return responseJson.user;
    } else {
      console.error('Kubios API returned error:', responseJson);
      throw createExternalApiError('Kubios-käyttäjätietojen haku epäonnistui');
    }
  } catch (error) {
    console.error('Error fetching Kubios user info:', error);
    if (error.status) throw error;
    throw createExternalApiError('Virhe Kubios-käyttäjätietojen haussa');
  }
};

/**
 * Käsittelee Kubios-kirjautumisen ja luo JWT-tokenin
 * @param {Request} req HTTP-pyyntö, joka sisältää käyttäjätunnuksen ja salasanan
 * @param {Response} res HTTP-vastaus, joka palautetaan asiakkaalle
 * @param {Function} next seuraava middlevare virheenkäsittelyyn
 * @description Kirjautuu käyttäjän Kubios API:in ja luo JWT-tokenin
 * @returns 
 */
const postLogin = async (req, res, next) => {
  const { kayttajanimi, salasana } = req.body;

  try {
    console.log('Processing Kubios login for user:', kayttajanimi);

    // First check if user exists in our database by email or username
    console.log('Finding user by email or username:', kayttajanimi);
    const localUser = await findUserByEmailOrUsername(kayttajanimi);

    if (!localUser) {
      return next(createNotFoundError(`Käyttäjää ei löydy järjestelmästä. Varmista, että sähköpostiosoite tai käyttäjänimi on oikein.`));
    }

    console.log(`Found local user with ID ${localUser.kayttaja_id} and username ${localUser.kayttajanimi}`);

    // Login to Kubios API
    const { idToken } = await kubiosLogin(kayttajanimi, salasana);

    // Get basic Kubios user info (optional - can be used for logging)
    const kubiosUser = await kubiosUserInfo(idToken);
    console.log('Kubios user info:', kubiosUser.email);

    // Create JWT token with Kubios token included
    const token = jwt.sign(
      {
        kayttaja_id: localUser.kayttaja_id,
        kubiosIdToken: idToken,
        kayttajarooli: localUser.kayttajarooli
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('Kubios login successful for user ID:', localUser.kayttaja_id);

    delete localUser.salasana;

    res.json(createResponse({
      token,
      user: localUser
    }, 'Kirjautuminen onnistui (Kubios)', Severity.SUCCESS));
  } catch (err) {
    console.error('Error in Kubios login process:', err);
    next(err);
  }
};

/**
 * Palauttaa kirjautuneen käyttäjän tiedot ja mahdollisen Kubios-tokenin
 * @param {Request} req - HTTP-pyyntö tokenin kera
 * @param {Response} res - JSON-vastaus käyttäjätiedoilla ja Kubios-tokenilla
 * @param {Function} next - Seuraava middleware virheenkäsittelyyn
 * @returns {object} JSON-vastaus (user ja kubios_token)
 * @route GET /api/auth/kubios-me
 */
const getKubiosMe = async (req, res, next) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT kayttaja_id, kayttajanimi, email, kayttajarooli FROM kayttaja WHERE kayttaja_id = ?',
      [req.user.kayttaja_id]
    );

    if (rows.length === 0) {
      return next(createNotFoundError('Käyttäjää ei löytynyt'));
    }

    res.json(createResponse({
      user: rows[0],
      kubios_token: req.user.kubiosIdToken
    }, 'Käyttäjätiedot haettu', Severity.SUCCESS));
  } catch (err) {
    next(createDatabaseError("Käyttäjätietojen hakeminen epäonnistui", err));
  }
};

export { postLogin, getKubiosMe, kubiosLogin };
