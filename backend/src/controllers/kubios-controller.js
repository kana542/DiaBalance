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
 * lähettää HTTP-pyynnön Kubios API -palveluun ja käsittelee vastauksen
 * @param {string} kubiosIdToken - autentikointitoken Kubios-palveluun
 * @param {string} endpoint - API-pääte/polku ilman perus-URL:ia (esim. "/user/self")
 * @param {Object} options - lisäasetukset fetch-kutsulle
 *   @param {string} [options.method] - HTTP-metodi (oletuksena 'GET')
 *   @param {Object} [options.body] - pyynnön runko (POST/PUT-pyynnöille)
 *   @param {Object} [options.headers] - lisäotsikot (yhdistetään oletusotsikoihin)
 * @returns {Promise<Object>} JSON-vastaus API-palvelusta
 * @throws {Error} heittää virheen jos API-kutsu epäonnistuu tai palvelin palauttaa virhekoodin
 */
const fetchFromKubiosApi = async (kubiosIdToken, endpoint, options = {}) => {
  // luodaan headers-objekti ja asetetaan tarvittavat otsikkotiedot
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', kubiosIdToken);

  // määritellään oletusasetukset, joita käytetään jos erikoisasetuksia ei ole annettu
  const defaultOptions = {
    method: 'GET',
    headers: headers,
  };

  // yhdistetään oletusasetukset ja annetut erikoisasetukset
  const mergedOptions = { ...defaultOptions, ...options };

  try {
    // suoritetaan varsinainen API-kutsu
    const response = await fetch(`${baseUrl}${endpoint}`, mergedOptions);

    // tarkistetaan onnistuiko pyyntö (HTTP-statuskoodi 200-299)
    if (!response.ok) {
      throw createExternalApiError(`Kubios API error: ${response.status} ${response.statusText}`);
    }

    // muunnetaan vastaus JSON-muotoon ja palautetaan se
    return await response.json();
  } catch (error) {
    // lokitetaan virhe ja välitetään se eteenpäin
    logger.error('Error fetching from Kubios API', error);
    throw error;
  }
};

/**
 * hakee käyttäjän kaikki HRV-mittaustulokset Kubios API -palvelusta
 * @param {Request} req - HTTP-pyyntöobjekti, jossa käyttäjän autentikointitiedot
 * @param {Object} req.user - autentikoitu käyttäjäobjekti
 * @param {string} req.user.kubiosIdToken - Kubios API:n autentikointitoken
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Promise<Response>} HTTP-vastaus, joka sisältää HRV-tiedot tai virheilmoituksen
 */
const getUserData = async (req, res, next) => {
  // poimitaan Kubios-token käyttäjän autentikointitiedoista
  const { kubiosIdToken } = req.user;

  try {
    // haetaan HRV-mittaustulokset Kubios API:sta määrätyltä aikaväliltä
    const results = await fetchFromKubiosApi(
      kubiosIdToken,
      '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00'
    );

    // varmistetaan että vastaus on olemassa
    if (!results) {
      throw createExternalApiError('Virheellinen vastaus Kubios API:sta: vastaus puuttuu');
    }

    // lokitetaan vastaus kehitystyötä varten
    logger.debug('Kubios API raw response', results);

    // palautetaan hakutulokset onnistumisviestillä
    return res.json(createResponse(results, "Kubios-tiedot haettu onnistuneesti", Severity.SUCCESS));
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja siirretään se keskitetylle käsittelijälle
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

    // palautetaan hakutulokset onnistumisviestillä
    return res.json(createResponse(userInfo, "Kubios-käyttäjätiedot haettu", Severity.SUCCESS));
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja siirretään se keskitetylle käsittelijälle
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
  // suodatetaan tulokset annetun päivämäärän mukaan
  const filtered = results.results?.filter((result) => {
    const resultDate = result.daily_result || result.measured_timestamp?.split('T')[0];
    return resultDate === date;
  });

  logger.debug(`Found ${filtered?.length || 0} results for date ${date}`);

  // muunnetaan tulokset yksinkertaisempaan muotoon jatkokäsittelyä varten
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
 * hakee käyttäjän HRV-datan tietylle päivälle
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää käyttäjätiedot
 * @param {Response} res - HTTP-vastausobjekti, joka palauttaa HRV-datan
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyyn
 * @returns {Object} JSON-vastaus HRV-datasta tai virheilmoitus
 */
const getUserDataByDate = async (req, res, next) => {
  // haetaan käyttäjän ID ja pyydetty päivämäärä
  const userId = req.user.kayttaja_id;
  const { date } = req.params;

  // noSave-parametri määrittää tallennetaanko data (oletuksena tallennetaan)
  const noSave = req.query.noSave === 'true';

  logger.debug(`Fetching Kubios data for user ${userId} on date ${date}, noSave: ${noSave}`);

  try {
    // haetaan Kubios-token tietokannasta
    const kubiosToken = await getKubiosToken(userId);

    // jos tokenia ei löydy tai se on vanhentunut, palautetaan virhe
    if (!kubiosToken) {
      return next(createAuthenticationError('Kubios-tokenia ei löydy tai se on vanhentunut. Kirjaudu uudelleen.'));
    }

    logger.debug('Got valid Kubios token from database');

    // haetaan HRV-data Kubios API:sta
    const results = await fetchFromKubiosApi(
      kubiosToken,
      '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00'
    );

    logger.debug('Got response from Kubios API');

    // suodatetaan ja muotoillaan tulokset annetulle päivälle
    const simplifiedResults = formatAndFilterResults(results, date);

    logger.debug(`HRV DATA FOR DATE: ${date}`, simplifiedResults);

    // tallennetaan tietokantaan oletuksena, ellei noSave=true parametria ole asetettu
    if (simplifiedResults.length > 0 && !noSave) {
      try {
        const dbResult = await storeHrvData(userId, date, simplifiedResults[0]);
        logger.debug('HRV data storage result', dbResult);
      } catch (dbError) {
        logger.error('Error storing HRV data', dbError);
      }
    } else if (simplifiedResults.length > 0 && noSave) {
      logger.info('HRV data found but not stored due to noSave=true');
    } else {
      logger.info(`No HRV data found for date: ${date}`);
    }

    // palautetaan tulokset
    res.json(createResponse(
      simplifiedResults,
      simplifiedResults.length > 0
        ? "HRV-tiedot haettu onnistuneesti"
        : "HRV-tietoja ei löytynyt annetulle päivälle",
      Severity.SUCCESS
    ));
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja välitetään se eteenpäin
    logger.error('Error fetching Kubios data by date', error);
    next(createExternalApiError('Virhe Kubios-tietojen haussa annetulle päivälle', error));
  }
};

/**
 * varmistaa, että perusmerkintä on olemassa ennen HRV-datan tallentamista
 * @param {number} userId - käyttäjän ID tietokannassa
 * @param {string} date - päivämäärä muodossa YYYY-MM-DD
 * @returns {Promise<boolean>} true jos merkintä on olemassa tai luotiin onnistuneesti, muuten false
 */
const ensureBaseEntryExists = async (userId, date) => {
  try {
    // tarkistetaan onko käyttäjällä jo merkintä annetulle päivälle
    const [entries] = await promisePool.query(
      'SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [userId, date]
    );

    // jos merkintää ei ole, luodaan uusi perusmerkintä
    if (entries.length === 0) {
      logger.debug(`Creating basic entry for date ${date} before saving HRV data`);

      // luodaan perusmerkintä vähimmäistiedoilla (tyhjät oireet ja HRV-kommentti)
      await promisePool.query(
        'INSERT INTO kirjaus (kayttaja_id, pvm, oireet, kommentti) VALUES (?, ?, ?, ?)',
        [userId, date, 'Ei oireita', 'HRV-datamerkintä']
      );

      // odotetaan 300ms tietokannan varmistamiseksi (transaktioiden käsittelyaika)
      await new Promise(resolve => setTimeout(resolve, 300));

      // varmistetaan että merkintä on todella tallentunut tietokantaan
      const [checkResult] = await promisePool.query(
        'SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
        [userId, date]
      );

      // jos merkintää ei löydy tarkistuksessa, lokitetaan virhe ja palautetaan epäonnistunut tulos
      if (checkResult.length === 0) {
        logger.error(`Failed to create base entry for date ${date}`);
        return false;
      }
    }

    // merkintä oli jo olemassa tai se luotiin onnistuneesti
    return true;
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja palautetaan epäonnistunut tulos
    logger.error('Error ensuring base entry exists', error);
    return false;
  }
};

/**
 * tallentaa käyttäjän HRV-datan tietylle päivämäärälle
 * @param {Request} req - HTTP-pyyntöobjekti, jossa HRV-data ja päivämäärä
 * @param {Object} req.user - autentikoitu käyttäjäobjekti
 * @param {number} req.user.kayttaja_id - käyttäjän ID tietokannassa
 * @param {Object} req.params - URL-parametrit
 * @param {string} req.params.date - päivämäärä muodossa YYYY-MM-DD
 * @param {Object} req.body - HRV-datatiedot (readiness, stress, bpm, sdnn_ms)
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Object} JSON-vastaus tallennuksen onnistumisesta tai virheestä
 */
const saveHrvData = async (req, res, next) => {
  // haetaan käyttäjän ID ja päivämäärä
  const userId = req.user.kayttaja_id;
  const { date } = req.params;
  const hrvData = req.body;

  logger.debug(`Saving HRV data for user ${userId} on date ${date}`, hrvData);

  try {
    // tarkistetaan että HRV-data on annettu
    if (!hrvData) {
      return next(createValidationError('HRV-data puuttuu'));
    }

    // varmistetaan että käyttäjällä on perusmerkintä kyseiselle päivälle
    // HRV-data liitetään aina perusmerkintään tietokannassa
    const baseEntrySuccess = await ensureBaseEntryExists(userId, date);
    if (!baseEntrySuccess) {
      return next(createDatabaseError('Failed to create required entry for HRV data'));
    }

    // tallennetaan HRV-data tietokantaan
    const result = await storeHrvData(userId, date, hrvData);

    // palautetaan onnistumisviesti
    res.json(createResponse({
      result
    }, 'HRV-data tallennettu onnistuneesti', Severity.SUCCESS));
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja välitetään se eteenpäin
    logger.error('Error saving HRV data', error);
    next(createDatabaseError('HRV-datan tallennus epäonnistui', error));
  }
};

export { getUserData, getUserInfo, getUserDataByDate, saveHrvData };
