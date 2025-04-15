// kubios-auth-controller.js - autentikointi ja tokenin hallinta Kubios-järjestelmän kanssa
// -------------------
// Käsittelee kirjautumisen Kubios API:in ja tokenien käsittelyn (idToken), sekä käyttäjätietojen yhdistämisen paikalliseen käyttäjään.

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

const baseUrl = process.env.KUBIOS_API_URI;

/**
 * 
 * Hakee käyttäjän Kubios-tiedot API:sta.
 * Käyttäjän on oltava kirjautuneena ja hänellä on oltava voimassa oleva Kubios-token.
* @async
* @param {Request} req Request objekti sisältää kubiosIdTokenin
* @param {Response} res
* @param {NextFunction} next
 */
const getUserData = async (req, res, next) => {
  const {kubiosIdToken} = req.user;
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', kubiosIdToken);

  try {
    const response = await fetch(
      baseUrl + '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00',
      {
        method: 'GET',
        headers: headers,
      },
    );

    if (!response.ok) {
      throw createExternalApiError(`Kubios API error: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    if (!results) {
      throw createExternalApiError('Virheellinen vastaus Kubios API:sta: vastaus puuttuu');
    }

    // logataan Kubios API:n vastaus debuggausta varten
    console.log('Kubios API raw response:');
    console.log(JSON.stringify(results, null, 2));

    return res.json(createResponse(results, "Kubios-tiedot haettu onnistuneesti", Severity.SUCCESS));
  } catch (error) {
    console.error('Error fetching Kubios data:', error);
    next(createExternalApiError('Virhe Kubios API:n haussa', error));
  }
};


/**
 * 
 * @param {Request} req request objekti, joka sisältää käyttäjätiedot
 * @param {Response} res response objekti, joka palauttaa käyttäjätiedot 
 * @param {Function} next seuraava middleware-funktio virheenkäsittelyyn
 * @description Hakee käyttäjätiedot Kubios API:sta käyttäen idTokenia
 * @returns 
 */
const getUserInfo = async (req, res, next) => {
  const {kubiosIdToken} = req.user;
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', kubiosIdToken);

  try {
    const response = await fetch(baseUrl + '/user/self', {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw createExternalApiError(`Kubios API error: ${response.status} ${response.statusText}`);
    }

    const userInfo = await response.json();

    // Perusvalidointi: tarkista että vastaus on olemassa ja siinä on odotettu rakenne
    if (!userInfo || !userInfo.status) {
      throw createExternalApiError('Virheellinen vastaus Kubios API:sta: käyttäjätiedot puuttuvat');
    }

    // Tarkista status
    if (userInfo.status !== 'ok') {
      throw createExternalApiError(`Kubios API virhe: ${userInfo.message || 'Tuntematon virhe'}`);
    }

    // logataan Kubios API:n käyttäjätiedot debuggausta varten
    console.log('Kubios API user info:');
    console.log(JSON.stringify(userInfo, null, 2));

    return res.json(createResponse(userInfo, "Kubios-käyttäjätiedot haettu", Severity.SUCCESS));
  } catch (error) {
    console.error('Error fetching Kubios user info:', error);
    next(createExternalApiError('Virhe Kubios-käyttäjätietojen haussa', error));
  }
};

/**
 * 
 * @param {Request} req request objekti, joka sisältää käyttäjätiedot
 * @param {Response} res response objekti, joka palauttaa käyttäjätiedot
 * @param {Function} next seuraava middleware-funktio virheenkäsittelyyn
 * @description Hakee käyttäjätiedot Kubios API:sta käyttäen idTokenia ja päivämäärää 
 * @returns {object} JSON-vastaus tallennuksen onnistumisesta
 * @route POST /api/kubios/user-data/:date
 */
const getUserDataByDate = async (req, res, next) => {
  const userId = req.user.kayttaja_id;
  const { date } = req.params;
  const noSave = req.query.noSave === 'true'; // Lisää tämä parametri

  console.log(`Fetching Kubios data for user ${userId} on date ${date}, noSave: ${noSave}`);

  try {
    // Hae Kubios-token tietokannasta
    const kubiosToken = await getKubiosToken(userId);

    if (!kubiosToken) {
      return next(createAuthenticationError('Kubios-tokenia ei löydy tai se on vanhentunut. Kirjaudu uudelleen.'));
    }

    console.log('Got valid Kubios token from database');

    const headers = new Headers();
    headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
    headers.append('Authorization', kubiosToken);

    console.log('Sending request to Kubios API...');
    const response = await fetch(
      baseUrl + '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00',
      {
        method: 'GET',
        headers: headers,
      }
    );

    if (!response.ok) {
      throw createExternalApiError(`Kubios API error: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    console.log('Got response from Kubios API');

    // Filtteröi tulokset annetun päivämäärän mukaan
    const filtered = results.results?.filter((result) => {
      const resultDate = result.daily_result || result.measured_timestamp?.split('T')[0];
      return resultDate === date;
    });

    console.log(`Found ${filtered?.length || 0} results for date ${date}`);

    
    // Muutetaan tulokset yksinkertaisemmaksi objektiksi
    const simplifiedResults = filtered.map((result) => {
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

    console.log('========= HRV DATA FOR DATE:', date, '=========');
    console.log(JSON.stringify(simplifiedResults, null, 2));
    console.log('==============================================');

    // MUUTOS: Tallenna tietokantaan vain jos noSave=false (oletusarvo)
    if (simplifiedResults.length > 0 && !noSave) {
      try {
        const dbResult = await storeHrvData(userId, date, simplifiedResults[0]);
        console.log('HRV data storage result:', dbResult);
      } catch (dbError) {
        console.error('Error storing HRV data:', dbError);
        
      }
    } else if (simplifiedResults.length > 0) {
      console.log('HRV data found but not stored due to noSave=true');
    } else {
      console.log('No HRV data found for date:', date);
    }

    res.json(createResponse(
      simplifiedResults,
      simplifiedResults.length > 0
        ? "HRV-tiedot haettu onnistuneesti"
        : "HRV-tietoja ei löytynyt annetulle päivälle",
      Severity.SUCCESS
    ));
  } catch (error) {
    console.error('Error fetching Kubios data by date:', error);
    next(createExternalApiError('Virhe Kubios-tietojen haussa annetulle päivälle', error));
  }
};

/**
 * 
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

  console.log(`Saving HRV data for user ${userId} on date ${date}:`, hrvData);

  try {
    if (!hrvData) {
      return next(createValidationError('HRV-data puuttuu'));
    }

    // Varmista että perusmerkintä on olemassa
    const [entries] = await promisePool.query(
      'SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [userId, date]
    );

    if (entries.length === 0) {
      console.log(`Creating basic entry for date ${date} before saving HRV data`);
      try {
        await promisePool.query(
          'INSERT INTO kirjaus (kayttaja_id, pvm, oireet, kommentti) VALUES (?, ?, ?, ?)',
          [userId, date, 'Ei oireita', 'HRV-datamerkintä']
        );
      } catch (insertError) {
        console.error('Error creating placeholder entry:', insertError);
        return next(createDatabaseError('Failed to create required entry for HRV data', insertError));
      }
    }

    // Tallenna HRV-data
    const result = await storeHrvData(userId, date, hrvData);

    res.json(createResponse({
      result
    }, 'HRV-data tallennettu onnistuneesti', Severity.SUCCESS));
  } catch (error) {
    console.error('Error saving HRV data:', error);
    next(createDatabaseError('HRV-datan tallennus epäonnistui', error));
  }
};

export { getUserData, getUserInfo, getUserDataByDate, saveHrvData };
