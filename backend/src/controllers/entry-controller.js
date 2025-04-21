/**
 * entry-controller.js - käyttäjän kirjaamien merkintöjen hallinta (CRUD)
 * -------------------
 * Käsittelee merkintöjen luomisen, haun, muokkauksen ja poistamisen tietokannasta.
 * Toimii rajapintana client-sovelluksen ja tietokannan välillä.
 *
 * pääominaisuudet:
 *    1. verensokerikirjausten CRUD-operaatiot (Create, Read, Update, Delete)
 *    2. äärimmäisten verensokeriarvojen tarkistus ja lokitus
 *    3. HRV-datan liittäminen merkintöihin integroidun näkymän tarjoamiseksi
 *    4. kenttien validointi ja tyhjien arvojen oikeaoppinen käsittely
 *
 * keskeiset toiminnot:
 *    - createEntry() - luo uuden päiväkirjamerkinnän
 *    - getEntriesByMonth() - hakee merkinnät kuukauden perusteella
 *    - updateEntry() - päivittää merkinnän tai luo uuden jos ei ole olemassa
 *    - deleteEntry() - poistaa merkinnän
 *
 * käyttö sovelluksessa:
 *    - kutsutaan entry-router.js -tiedoston kautta API-pyyntöjen käsittelemiseksi
 *    - mahdollistaa käyttäjäkohtaisen verensokeriseurannan tietokannan avulla
 *    - yhdistää HRV-datan verensokerimerkintöihin kokonaisvaltaisen terveysnäkymän luomiseksi
 */

import promisePool from '../utils/database.js';
import { insertKirjaus, getKirjauksetByMonth, updateKirjaus, deleteKirjaus } from "../models/entry-models.js";
import { getHrvData } from '../models/hrv-model.js';

import {
  createValidationError,
  createDatabaseError,
  createNotFoundError,
  createResponse,
  Severity
} from '../middlewares/error-handler.js';
import logger from "../utils/logger.js"

/**
 * Tarkistaa ja lokittaa äärimmäiset verensokeriarvot
 * @param {Object} data - Merkintädata
 */
const checkExtremeValues = (data) => {
  for (const [kentta, arvo] of Object.entries(data)) {
    if (kentta.startsWith('vs_') && arvo !== null) {
      if (arvo < 3) {
        logger.warn(`Huomio: Matala verensokeriarvo (${arvo}) kentässä ${kentta}`);
      } else if (arvo > 20) {
        logger.warn(`Huomio: Korkea verensokeriarvo (${arvo}) kentässä ${kentta}`);
      }
    }
  }
};

/**
 * Hakee HRV-datan merkinnälle
 * @param {number} kayttajaId - Käyttäjän ID
 * @param {string} pvm - Päivämäärä
 * @returns {Object|null} HRV-data tai null jos sitä ei ole
 */
const getEntryHrvData = async (kayttajaId, pvm) => {
  try {
    const [hrvRows] = await promisePool.query(
      'SELECT * FROM hrv_kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, pvm]
    );

    return hrvRows && hrvRows.length > 0 ? hrvRows[0] : null;
  } catch (e) {
    logger.error(`Error fetching HRV data for ${pvm}`, e);
    return null;
  }
};

/**
 * Luo uuden päiväkirjamerkinnän käyttäjälle.
 * @param {Request} req - HTTP-pyyntö, bodyssä kaikki merkinnän kentät
 * @param {Response} res - HTTP-vastaus JSON-muodossa
 * @param {Function} next - Seuraava middleware virheenkäsittelyyn
 * @returns {object} JSON-vastaus, jossa luodun merkinnän ID
 * @route POST /api/entries
 */
const createEntry = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const kirjausData = req.body;

  try {
    // Tarkistetaan äärimmäiset arvot lokitusta varten
    checkExtremeValues(kirjausData);

    const result = await insertKirjaus(kayttajaId, kirjausData);
    res.status(201).json(createResponse({
        id: result.insertId
    }, 'Kirjaus lisätty onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      next(createDatabaseError("Kirjauksen lisääminen epäonnistui", error));
  }
};

/**
 * Hakee kaikki merkinnät tietylle kuukaudelle
 * HRV-data haetään päiväkohtaisesti ja lisätään merkinnän yhteyteen
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns
 */
const getEntriesByMonth = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const { year, month } = req.query;

  logger.debug(`Request for entries: year=${year}, month=${month}, user=${kayttajaId}`);

  if (!year || !month) {
    return next(createValidationError('Vuosi (year) ja kuukausi (month) parametrit vaaditaan'));
  }

  try {
    // Hae kirjaukset
    const entries = await getKirjauksetByMonth(kayttajaId, parseInt(year), parseInt(month));

    // Lisää HRV-data jokaiseen merkintään
    const formattedEntries = await Promise.all(entries.map(async entry => {
      try {
        if (entry.formatted_date) {
          entry.pvm = entry.formatted_date;
        }

        // Hae HRV-data päivälle
        const hrvData = await getEntryHrvData(kayttajaId, entry.pvm);
        if (hrvData) {
          entry.hrv_data = hrvData;
        }

        return entry;
      } catch (e) {
        logger.error(`Error processing entry for ${entry.pvm}`, e);
        return entry;
      }
    }));

    logger.debug(`Returning ${formattedEntries.length} entries`);
    res.json(createResponse(formattedEntries, `Haettu ${formattedEntries.length} merkintää`, Severity.SUCCESS));
  } catch (error) {
    logger.error("Error in getEntriesByMonth", error);
    next(createDatabaseError("Merkintöjen hakeminen epäonnistui", error));
  }
};

/**
 * Käsittelee kenttäarvot oikein (tyhjät arvot muutetaan nulliksi)
 * @param {Object} data - Merkintädata
 * @param {Array} fields - Kenttien nimet
 * @returns {Object} Käsitelty data
 */
const processFieldValues = (data, fields) => {
  const result = {...data};

  fields.forEach(field => {
    if (result[field] === '' || result[field] === undefined) {
      result[field] = null;
    }
  });

  return result;
};

/**
 * Päivittää olemassa olevan merkinnän käyttäjälle tietylle päivälle.
 * Jos kenttäarvo on tyhjä tai puuttuu, se asetetaan nulliksi.
 * Käytetään PUT /api/entries -reitillä.
 * @param {Request} req HTTP-pyyntö, joka sisältää päivitetyt tiedot
 * @param {Response} res HTTP-vastaus, joka palautetaan asiakkaalle
 * @param {Function} next seuraava middleware-funktio virheenkäsittelyyn
 * @description Päivittää käyttäjän merkintätiedot tietokannassa
 * @returns {Object} JSON-vastaus, joka sisältää päivitetyt tiedot ja onnistumisviestin
 */
const updateEntry = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  let kirjausData = req.body;

  logger.debug(`Update request for date: ${kirjausData.pvm}`, kirjausData);

  if (!kirjausData.pvm) {
      return next(createValidationError('Päivämäärä (pvm) vaaditaan'));
  }

  try {
      const numericFields = [
          'vs_aamu', 'vs_ilta',
          'vs_aamupala_ennen', 'vs_aamupala_jalkeen',
          'vs_lounas_ennen', 'vs_lounas_jalkeen',
          'vs_valipala_ennen', 'vs_valipala_jalkeen',
          'vs_paivallinen_ennen', 'vs_paivallinen_jalkeen',
          'vs_iltapala_ennen', 'vs_iltapala_jalkeen'
      ];

      // Käsittele tyhjät arvot oikein (null)
      kirjausData = processFieldValues(kirjausData, numericFields);

      logger.debug("Processed data for update", kirjausData);

      const result = await updateKirjaus(kayttajaId, kirjausData);
      res.json(createResponse({
          affectedRows: result.affectedRows || 1
      }, 'Kirjaus päivitetty onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      logger.error("Error in updateEntry", error);
      next(createDatabaseError("Kirjauksen päivittäminen epäonnistui", error));
  }
};

/**
 * Poistaa merkinnän tietokannasta.
 * @param {Request} req - HTTP-pyyntö
 * @param {Response} res - HTTP-vastaus
 * @param {Function} next - Virheenkäsittelijä
 * @returns {Object} Vastaus poiston onnistumisesta
 */
const deleteEntry = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const date = req.params.date;

  logger.debug(`Delete request for date: ${date}`);

  if (!date) {
      return next(createValidationError('Päivämäärä (date) vaaditaan'));
  }

  try {
      const result = await deleteKirjaus(kayttajaId, date);

      if (result.affectedRows === 0) {
          return next(createNotFoundError('Kirjausta ei löytynyt poistettavaksi'));
      }

      res.json(createResponse({
          affectedRows: result.affectedRows
      }, 'Kirjaus poistettu onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      logger.error("Error in deleteEntry", error);
      next(createDatabaseError("Kirjauksen poistaminen epäonnistui", error));
  }
};

export { createEntry, getEntriesByMonth, updateEntry, deleteEntry };
