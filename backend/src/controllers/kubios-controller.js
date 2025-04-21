/**
 * kubios-controller.js - Kubios HRV -datan käsittely
 * -------------------
 * Käsittelee Kubios API -kutsut ja HRV-datan tallennuksen.
 * Toimii rajapintana Kubios Cloud API:n ja sovelluksen välillä.
 *
 * pääominaisuudet:
 *    1. Kubios API -kutsujen käsittely autentikoidulle käyttäjälle
 *    2. HRV-datan hakeminen, suodatus ja muotoilu sovelluksen käyttöön
 *    3. HRV-datan tallennus tietokantaan verensokerimerkintöjen rinnalle
 *    4. käyttäjäkohtaisten HRV-mittaustulosten hallinta päivämäärän perusteella
 *
 * keskeiset toiminnot:
 *    - getUserData() - hakee käyttäjän kaikki HRV-mittaustulokset Kubios API:sta
 *    - getUserInfo() - noutaa käyttäjän perustiedot Kubios API:sta
 *    - getUserDataByDate() - hakee tietyn päivän HRV-tiedot
 *    - saveHrvData() - tallentaa HRV-datan tietokantaan
 *
 * käyttö sovelluksessa:
 *    - tarjoaa dashboard-näkymälle HRV-datan näyttämistä varten
 *    - mahdollistaa käyttäjälle terveystietojen kokonaisvaltaisen seurannan
 *    - integroituu verensokerimerkintöihin antaen laajemman kuvan terveydentilasta
 */

import promisePool from '../utils/database.js';
import 'dotenv/config';
import fetch from 'node-fetch';
import { storeHrvData } from '../models/hrv-model.js';
import { getKubiosToken } from '../models/user-model.js';

import {
  createExternalApiError,
  createAuthenticationError,
  createValidationError,
  createDatabaseError,
  createResponse,
  Severity
} from '../middlewares/error-handler.js';
import logger from "../utils/logger.js"

const baseUrl = process.env.KUBIOS_API_URI;

/**
 * Lähettää pyynnön Kubios API:lle
 * @param {string} kubiosIdToken - Kubios API -token
 * @param {string} endpoint - API-pääte
 * @param {Object} options - Fetch-asetukset
 * @returns {Promise<Object>} API-vastaus
 */
const fetchFromKubiosApi = async (kubiosIdToken, endpoint, options = {}) => {
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', kubiosIdToken);

  const defaultOptions = {
    method: 'GET',
    headers: headers,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, mergedOptions);

    if (!response.ok) {
      throw createExternalApiError(`Kubios API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching from Kubios API', error);
    throw error;
  }
};

/**
 * Hakee käyttäjän Kubios-tiedot API:sta.
 * Käyttäjän on oltava kirjautuneena ja hänellä on oltava voimassa oleva Kubios-token.
 * @async
 * @param {Request} req Request objekti sisältää kubiosIdTokenin
 * @param {Response} res
 * @param {NextFunction} next
 */
const getUserData = async (req, res, next) => {
  const { kubiosIdToken } = req.user;

  try {
    const results = await fetchFromKubiosApi(
      kubiosIdToken,
      '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00'
    );

    if (!results) {
      throw createExternalApiError('Virheellinen vastaus Kubios API:sta: vastaus puuttuu');
    }

    // Logataan Kubios API:n vastaus debuggausta varten
    logger.debug('Kubios API raw response', results);

    return res.json(createResponse(results, "Kubios-tiedot haettu onnistuneesti", Severity.SUCCESS));
  } catch (error) {
    logger.error('Error fetching Kubios data', error);
    next(createExternalApiError('Virhe Kubios API:n haussa', error));
  }
};

/**
 * Hakee käyttäjätiedot Kubios API:sta
 * @param {Request} req request objekti, joka sisältää käyttäjätiedot
 * @param {Response} res response objekti, joka palauttaa käyttäjätiedot
 * @param {Function} next seuraava middleware-funktio virheenkäsittelyyn
 * @description Hakee käyttäjätiedot Kubios API:sta käyttäen idTokenia
 */
const getUserInfo = async (req, res, next) => {
  const { kubiosIdToken } = req.user;

  try {
    const userInfo = await fetchFromKubiosApi(kubiosIdToken, '/user/self');

    // Perusvalidointi: tarkista että vastaus on olemassa ja siinä on odotettu rakenne
    if (!userInfo || !userInfo.status) {
      throw createExternalApiError('Virheellinen vastaus Kubios API:sta: käyttäjätiedot puuttuvat');
    }

    // Tarkista status
    if (userInfo.status !== 'ok') {
      throw createExternalApiError(`Kubios API virhe: ${userInfo.message || 'Tuntematon virhe'}`);
    }

    // Logataan Kubios API:n käyttäjätiedot debuggausta varten
    logger.debug('Kubios API user info', userInfo);

    return res.json(createResponse(userInfo, "Kubios-käyttäjätiedot haettu", Severity.SUCCESS));
  } catch (error) {
    logger.error('Error fetching Kubios user info', error);
    next(createExternalApiError('Virhe Kubios-käyttäjätietojen haussa', error));
  }
};

/**
 * Suodattaa ja muotoilee HRV-datan
 * @param {Array} results - Kubios API -vastauksen tulokset
 * @param {string} date - Päivämäärä, jolle data halutaan
 * @returns {Array} Muotoillut tulokset
 */
const formatAndFilterResults = (results, date) => {
  // Filtteröi tulokset annetun päivämäärän mukaan
  const filtered = results.results?.filter((result) => {
    const resultDate = result.daily_result || result.measured_timestamp?.split('T')[0];
    return resultDate === date;
  });

  logger.debug(`Found ${filtered?.length || 0} results for date ${date}`);

  // Muutetaan tulokset yksinkertaisemmaksi objektiksi
  return filtered.map((result) => {
    const data = result.result || {};

    return {
      date: result.daily_result || result.measured_timestamp?.split('T')[0],
      stress_index: data.stress_index,
      readiness: data.readiness,
      physiological_age: data.physiological_age,
      mean_hr_bpm: data.mean_hr_bpm,
      sdnn_ms: data.sdnn_ms,
    };
  });
};

/**
 * Hakee käyttäjän HRV-datan tietylle päivälle
 * @param {Request} req request objekti, joka sisältää käyttäjätiedot
 * @param {Response} res response objekti, joka palauttaa käyttäjätiedot
 * @param {Function} next seuraava middleware-funktio virheenkäsittelyyn
 * @description Hakee käyttäjätiedot Kubios API:sta käyttäen idTokenia ja päivämäärää
 * @returns {object} JSON-vastaus HRV-datasta
 * @route GET /api/kubios/user-data/:date
 */
const getUserDataByDate = async (req, res, next) => {
  const userId = req.user.kayttaja_id;
  const { date } = req.params;
  const noSave = req.query.noSave === 'true';

  logger.debug(`Fetching Kubios data for user ${userId} on date ${date}, noSave: ${noSave}`);

  try {
    // Hae Kubios-token tietokannasta
    const kubiosToken = await getKubiosToken(userId);

    if (!kubiosToken) {
      return next(createAuthenticationError('Kubios-tokenia ei löydy tai se on vanhentunut. Kirjaudu uudelleen.'));
    }

    logger.debug('Got valid Kubios token from database');

    // Hae data Kubios API:sta
    const results = await fetchFromKubiosApi(
      kubiosToken,
      '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00'
    );

    logger.debug('Got response from Kubios API');

    // Suodatat ja muotoile tulokset
    const simplifiedResults = formatAndFilterResults(results, date);

    logger.debug(`HRV DATA FOR DATE: ${date}`, simplifiedResults);

    // Tallenna tietokantaan vain jos noSave=false (oletusarvo)
    if (simplifiedResults.length > 0 && !noSave) {
      try {
        const dbResult = await storeHrvData(userId, date, simplifiedResults[0]);
        logger.debug('HRV data storage result', dbResult);
      } catch (dbError) {
        logger.error('Error storing HRV data', dbError);
      }
    } else if (simplifiedResults.length > 0) {
      logger.info('HRV data found but not stored due to noSave=true');
    } else {
      logger.info(`No HRV data found for date: ${date}`);
    }

    res.json(createResponse(
      simplifiedResults,
      simplifiedResults.length > 0
        ? "HRV-tiedot haettu onnistuneesti"
        : "HRV-tietoja ei löytynyt annetulle päivälle",
      Severity.SUCCESS
    ));
  } catch (error) {
    logger.error('Error fetching Kubios data by date', error);
    next(createExternalApiError('Virhe Kubios-tietojen haussa annetulle päivälle', error));
  }
};

/**
 * Varmistaa, että perusmerkintä on olemassa ennen HRV-datan tallentamista
 * @param {number} userId - Käyttäjän ID
 * @param {string} date - Päivämäärä
 * @returns {Promise<boolean>} Onnistuiko varmistus
 */
const ensureBaseEntryExists = async (userId, date) => {
  try {
    const [entries] = await promisePool.query(
      'SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [userId, date]
    );

    if (entries.length === 0) {
      logger.debug(`Creating basic entry for date ${date} before saving HRV data`);
      await promisePool.query(
        'INSERT INTO kirjaus (kayttaja_id, pvm, oireet, kommentti) VALUES (?, ?, ?, ?)',
        [userId, date, 'Ei oireita', 'HRV-datamerkintä']
      );
    }

    return true;
  } catch (error) {
    logger.error('Error ensuring base entry exists', error);
    return false;
  }
};

/**
 * Tallentaa HRV-datan tiettyä päivää varten
 * @param {Request} req - HTTP-pyyntö, bodyssä HRV-data ja URL-parametrina :date
 * @param {Response} res - HTTP-vastaus tallennuksen onnistumisesta
 * @param {Function} next - Seuraava middleware virheenkäsittelyyn
 * @returns {object} JSON-vastaus tallennuksen onnistumisesta
 * @route POST /api/kubios/user-data/:date
 */
const saveHrvData = async (req, res, next) => {
  const userId = req.user.kayttaja_id;
  const { date } = req.params;
  const hrvData = req.body;

  logger.debug(`Saving HRV data for user ${userId} on date ${date}`, hrvData);

  try {
    if (!hrvData) {
      return next(createValidationError('HRV-data puuttuu'));
    }

    // Varmista että perusmerkintä on olemassa
    const baseEntrySuccess = await ensureBaseEntryExists(userId, date);
    if (!baseEntrySuccess) {
      return next(createDatabaseError('Failed to create required entry for HRV data'));
    }

    // Tallenna HRV-data
    const result = await storeHrvData(userId, date, hrvData);

    res.json(createResponse({
      result
    }, 'HRV-data tallennettu onnistuneesti', Severity.SUCCESS));
  } catch (error) {
    logger.error('Error saving HRV data', error);
    next(createDatabaseError('HRV-datan tallennus epäonnistui', error));
  }
};

export { getUserData, getUserInfo, getUserDataByDate, saveHrvData };
