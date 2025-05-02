/**
 * user-model.js - käyttäjätietojen hallinta ja autentikointiin liittyvät toiminnot
 * --------------
 * Sisältää toiminnot käyttäjän luontiin, kirjautumiseen, tietojen päivittämiseen sekä Kubios-tokenin käsittelyyn.
 * Käytetään auth-controller.js, user-controller.js ja kubios-controller.js -tiedostoissa.
 *
 * pääominaisuudet:
 *    1. käyttäjätilien hallinta tietokannassa (rekisteröinti, kirjautuminen, tietojen päivitys)
 *    2. Kubios-tokenien tallennus, haku ja poisto tietokannasta sekä välimuistista
 *    3. käyttäjäprofiilin tietojen hallinta ja päivitys
 *    4. tietokantaoperaatioiden kapselointi ja virheenkäsittely
 *
 * keskeiset toiminnot:
 *    - registerUser() - luo uuden käyttäjän tietokantaan
 *    - loginUser() - hakee käyttäjän tiedot kirjautumista varten
 *    - getMyProfile() - hakee kirjautuneen käyttäjän profiilin
 *    - updateMyProfile() - päivittää käyttäjän tiedot
 *    - updateKubiosToken() - tallentaa Kubios-tokenin käyttäjälle
 *    - getKubiosToken() - hakee voimassaolevan Kubios-tokenin
 *    - removeKubiosToken() - poistaa Kubios-tokenin uloskirjautuessa
 *
 * käyttö sovelluksessa:
 *    - toimii tietokantalayer-tasona autentikaatio- ja käyttäjätietoja käsitteleville kontrollereille
 *    - mahdollistaa turvallisen käyttäjähallinnan ja autentikaation
 *    - integroi Kubios-tokenien hallinnan osaksi käyttäjätietojärjestelmää
 */

import promisePool from '../utils/database.js';
import { executeQuery } from '../utils/database.js';
import { cacheToken, getTokenFromCache, removeTokenFromCache } from '../utils/token-cache.js';
import logger from "../utils/logger.js"

/**
 * Rekisteröi uusi käyttäjä
 * Lisää uuden käyttäjän tietokantaan tauluun kayttaja
 * Tallettaa käyttäjätiedot (kayttajanimi, email, salasana, kayttajarooli)
 * Palauttaa uuden käyttäjän ID:n
 * @param {Object} user käyttäjätiedot (kayttajanimi, email, salasana, kayttajarooli)
 * @returns {number} lisätyn käyttäjän ID
 */
const registerUser = async (user) => {
  try {
    const [result] = await promisePool.query(
      'INSERT INTO kayttaja (kayttajanimi, email, salasana, kayttajarooli) VALUES (?, ?, ?, ?)',
      [user.kayttajanimi, user.email || null, user.salasana, user.kayttajarooli]
    );
    return result.insertId;
  } catch (error) {
    logger.error('Error registerUser', error);
    throw new Error('Database error');
  }
};

/**
 * Hae käyttäjä kirjautumista varten käyttäjänimen perusteella
 * käytetään auth-controllerissa ja kirjautumisessa POST /api/auth/login
 * Hakee käyttäjän tiedot (kayttaja_id, kayttajanimi, email, salasana, kayttajarooli) tietokannasta
 * @param {string} kayttajanimi
 * @returns {Object|null} käyttäjän tiedot salasanoineen tai null
 */
const loginUser = async (kayttajanimi) => {
    try {
      return await executeQuery(
        'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?',
        [kayttajanimi],
        'Error loginUser'
      ).then(rows => rows[0] || null);
    } catch (error) {
      logger.error('Error loginUser', error);
      throw new Error('Database error');
    }
  };

/**
 * Hae käyttäjän omat tiedot ID:n perusteella
 * @param {number} kayttajaId
 * @returns {Object|null} käyttäjätiedot ilman salasanaa
 */
const getMyProfile = async (kayttajaId) => {
    try {
      return await executeQuery(
        'SELECT kayttaja_id, kayttajanimi, email, kayttajarooli FROM kayttaja WHERE kayttaja_id = ?',
        [kayttajaId],
        'Error getMyProfile'
      ).then(rows => rows[0] || null);
    } catch (error) {
      logger.error('Error getMyProfile', error);
      throw new Error('Database error');
    }
  };

/**
 * Päivitä käyttäjän omat tiedot
 * Tukee käyttäjätunnuksen, sähköpostin ja salasanan päivitystä
 * @param {number} kayttajaId
 * @param {Object} data - päivitettävät tiedot (kayttajanimi, email, salasana)
 * @returns {Object} tulosviesti
 */
const updateMyProfile = async (kayttajaId, data) => {
    try {
      const updateFields = [];
      const values = [];

      if (data.kayttajanimi) {
        updateFields.push('kayttajanimi = ?');
        values.push(data.kayttajanimi);
      }

      if (data.email) {
        updateFields.push('email = ?');
        values.push(data.email);
      }

      if (data.salasana) {
        updateFields.push('salasana = ?');
        values.push(data.salasana);
      }

      if (updateFields.length === 0) {
        return { error: 'Ei päivitettäviä kenttiä' };
      }

      values.push(kayttajaId);

      const [result] = await promisePool.query(
        `UPDATE kayttaja SET ${updateFields.join(', ')} WHERE kayttaja_id = ?`,
        values
      );

      return {
        message: 'Tiedot päivitetty onnistuneesti',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      logger.error('Error updateMyProfile', error);
      throw new Error('Database error');
    }
  };

/**
 * Hallitsee Kubios-tokenia (lisäys, poisto, haku)
 * @param {number} userId - Käyttäjän ID
 * @param {string} action - Toiminto ('set', 'get', 'remove')
 * @param {string|null} token - Kubios-token (set-toiminnolle)
 * @param {number|null} expiresIn - Vanhentumisaika (set-toiminnolle)
 * @returns {boolean|string|null} Toiminnon tulos
 */
const manageKubiosToken = async (userId, action, token = null, expiresIn = null) => {
  try {
    switch(action) {
      case 'set':
        if (!token || !expiresIn) {
          throw new Error('Token and expiresIn required for set action');
        }

        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(expiresIn));

        const [setResult] = await promisePool.query(
          'UPDATE kayttaja SET kubios_token = ?, kubios_expiration = ? WHERE kayttaja_id = ?',
          [token, expirationDate, userId]
        );

        // Tallenna myös välimuistiin
        cacheToken(userId, token, expirationDate);

        return setResult.affectedRows > 0;

      case 'get':
        // Tarkista ensin välimuistista
        const cachedToken = getTokenFromCache(userId);
        if (cachedToken) return cachedToken;

        // Hae tietokannasta jos ei välimuistissa
        const [getRows] = await promisePool.query(
          'SELECT kubios_token, kubios_expiration FROM kayttaja WHERE kayttaja_id = ?',
          [userId]
        );

        if (getRows.length === 0) return null;

        const dbToken = getRows[0].kubios_token;
        const expiration = getRows[0].kubios_expiration;

        if (!dbToken || !expiration) return null;

        const now = new Date();
        const expirationDate2 = new Date(expiration);

        // Tarkista vanhentuminen
        if (expirationDate2 <= now || (expirationDate2 - now) < 5 * 60 * 1000) {
          return null;
        }

        // Tallenna välimuistiin ja palauta
        cacheToken(userId, dbToken, expirationDate2);
        return dbToken;

      case 'remove':
        // Poista tietokannasta
        await promisePool.query(
          'UPDATE kayttaja SET kubios_token = NULL, kubios_expiration = NULL WHERE kayttaja_id = ?',
          [userId]
        );

        // Poista välimuistista
        removeTokenFromCache(userId);
        return true;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    logger.error(`Error in manageKubiosToken (${action})`, error);
    throw new Error(`Database error in token management: ${error.message}`);
  }
};

/**
 * Päivitä Kubios token ja vanhentumisaika käyttäjälle
 * @param {number} userId - Käyttäjän ID
 * @param {string} token - Kubios token
 * @param {number} expiresIn - Vanhentumisaika sekunneissa
 * @returns {boolean} Onnistuiko päivitys
 */
const updateKubiosToken = async (userId, token, expiresIn) => {
  logger.debug(`Updating Kubios token for user ${userId}`);
  return await manageKubiosToken(userId, 'set', token, expiresIn);
};

/**
 * Hae Kubios token käyttäjälle
 * @param {number} userId - Käyttäjän ID
 * @returns {string|null} Kubios token tai null jos vanhentunut/ei löydy
 */
const getKubiosToken = async (userId) => {
  return await manageKubiosToken(userId, 'get');
};

/**
 * Poista Kubios token käyttäjältä
 * @param {number} userId - Käyttäjän ID
 * @returns {boolean} Onnistuiko poisto
 */
const removeKubiosToken = async (userId) => {
  logger.debug(`Removing Kubios token for user ${userId}`);
  return await manageKubiosToken(userId, 'remove');
};

export {
    registerUser,
    loginUser,
    getMyProfile,
    updateMyProfile,
    updateKubiosToken,
    getKubiosToken,
    removeKubiosToken
};
