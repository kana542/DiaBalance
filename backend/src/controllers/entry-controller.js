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
  // käydään läpi kaikki data-objektin kentät ja arvot
  for (const [kentta, arvo] of Object.entries(data)) {
    // tarkistetaan vain verensokeriarvot (vs_-alkuiset kentät)
    if (kentta.startsWith('vs_') && arvo !== null) {
      // varoitetaan matalista arvoista (alle 3 mmol/l)
      if (arvo < 3) {
        logger.warn(`Huomio: Matala verensokeriarvo (${arvo}) kentässä ${kentta}`);
        // varoitetaan korkeista arvoista (yli 20 mmol/l)
      } else if (arvo > 20) {
        logger.warn(`Huomio: Korkea verensokeriarvo (${arvo}) kentässä ${kentta}`);
      }
    }
  }
};

/**
 * hakee käyttäjän HRV-mittaustiedot tietylle päivälle tietokannasta
 * @param {number} kayttajaId - käyttäjän yksilöllinen tunniste
 * @param {string} pvm - päivämäärä muodossa YYYY-MM-DD
 * @returns {Object|null} HRV-mittaustiedot objektina tai null jos tietoja ei löydy
 */
const getEntryHrvData = async (kayttajaId, pvm) => {
  try {
    // suoritetaan tietokantakysely HRV-tietojen hakemiseksi
    const [hrvRows] = await promisePool.query(
      'SELECT * FROM hrv_kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, pvm]
    );

    // palautetaan ensimmäinen rivi jos tuloksia löytyi, muuten null
    return hrvRows && hrvRows.length > 0 ? hrvRows[0] : null;
    // virhetilanteessa lokitetaan virhe ja palautetaan null
  } catch (e) {
    logger.error(`Error fetching HRV data for ${pvm}`, e);
    return null;
  }
};

/**
 * luo uuden päiväkirjamerkinnän käyttäjälle
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää merkinnän tiedot
 * @param {Object} req.user - autentikoitu käyttäjäobjekti
 * @param {number} req.user.kayttaja_id - käyttäjän ID tietokannassa
 * @param {Object} req.body - merkinnän sisältö (verensokeritiedot, oireet, kommentit)
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Object} JSON-vastaus, joka sisältää luodun merkinnän ID:n
 */
const createEntry = async (req, res, next) => {
  // poimitaan käyttäjän ID autentikointitiedoista
  const kayttajaId = req.user.kayttaja_id;
  // haetaan merkinnän tiedot pyynnön rungosta
  const kirjausData = req.body;

  try {
    // tarkistetaan onko merkinnässä äärimmäisiä verensokeriarvoja
    // (arvot lokitetaan varoituksina jos ne ovat liian matalia tai korkeita)
    checkExtremeValues(kirjausData);

    // tallennetaan merkintä tietokantaan käyttäjän ID:n ja annettujen tietojen perusteella
    const result = await insertKirjaus(kayttajaId, kirjausData);

    // vastataan 201 Created -statuskoodilla ja onnistumisviestillä
    res.status(201).json(createResponse({
        id: result.insertId // palautetaan luodun merkinnän ID
    }, 'Kirjaus lisätty onnistuneesti', Severity.SUCCESS));
  } catch (error) {
    // virhetilanteessa siirretään virhe keskitetylle käsittelijälle
      next(createDatabaseError("Kirjauksen lisääminen epäonnistui", error));
  }
};

/**
 * hakee käyttäjän kaikki verensokerimerkinnät tietyltä kuukaudelta
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää hakuparametrit
 * @param {Object} req.user - autentikoitu käyttäjäobjekti
 * @param {number} req.user.kayttaja_id - käyttäjän ID tietokannassa
 * @param {Object} req.query - URL-kyselyparametrit
 * @param {string} req.query.year - vuosi, jolta merkinnät haetaan (esim. "2025")
 * @param {string} req.query.month - kuukausi, jolta merkinnät haetaan (1-12)
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Object} JSON-vastaus, joka sisältää kuukauden merkinnät ja HRV-tiedot
 */
const getEntriesByMonth = async (req, res, next) => {
  // poimitaan käyttäjän ID ja hakuparametrit
  const kayttajaId = req.user.kayttaja_id;
  const { year, month } = req.query;

  logger.debug(`Request for entries: year=${year}, month=${month}, user=${kayttajaId}`);

  // varmistetaan että pakolliset parametrit on annettu
  if (!year || !month) {
    return next(createValidationError('Vuosi (year) ja kuukausi (month) parametrit vaaditaan'));
  }

  try {
    // haetaan kuukauden kaikki verensokerimerkinnät tietokannasta
    const entries = await getKirjauksetByMonth(kayttajaId, parseInt(year), parseInt(month));

    // käsitellään jokainen merkintä ja lisätään niihin HRV-data jos sellaista on
    const formattedEntries = await Promise.all(entries.map(async entry => {
      try {
        // varmistetaan että päivämäärä on yhdenmukaisessa muodossa
        if (entry.formatted_date) {
          entry.pvm = entry.formatted_date;
        }

         // haetaan päiväkohtainen HRV-data ja lisätään se merkintään
        const hrvData = await getEntryHrvData(kayttajaId, entry.pvm);
        if (hrvData) {
          entry.hrv_data = hrvData;
        }

        return entry;
      } catch (e) {
        // virhetilanteessa lokitetaan virhe mutta jatketaan prosessia
        logger.error(`Error processing entry for ${entry.pvm}`, e);
        return entry;
      }
    }));

    // palautetaan muotoillut merkinnät
    logger.debug(`Returning ${formattedEntries.length} entries`);
    res.json(createResponse(formattedEntries, `Haettu ${formattedEntries.length} merkintää`, Severity.SUCCESS));
  } catch (error) {
    // virhetilanteessa lokitetaan virhe ja siirretään se keskitetylle käsittelijälle
    logger.error("Error in getEntriesByMonth", error);
    next(createDatabaseError("Merkintöjen hakeminen epäonnistui", error));
  }
};

/**
 * käsittelee merkintäobjektin kenttäarvot ja muuntaa tyhjät arvot null-arvoiksi
 * @param {Object} data - käsiteltävä merkintäobjekti
 * @param {Array<string>} fields - tarkistettavien kenttien nimet taulukossa
 * @returns {Object} käsitelty objekti, jossa tyhjät arvot on muutettu null-arvoiksi
 */
const processFieldValues = (data, fields) => {
  // luodaan kopio alkuperäisestä objektista muutosten tekemistä varten
  const result = {...data};

  // käydään läpi kaikki määritellyt kentät
  fields.forEach(field => {
    // muutetaan tyhjät merkkijonot ja määrittelemättömät arvot null-arvoiksi
    if (result[field] === '' || result[field] === undefined) {
      result[field] = null;
    }
  });

  // palautetaan käsitelty objekti
  return result;
};

/**
 * päivittää käyttäjän verensokerimerkinnän tietylle päivälle
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää päivitettävät tiedot
 * @param {Object} req.user - autentikoitu käyttäjäobjekti
 * @param {number} req.user.kayttaja_id - käyttäjän ID tietokannassa
 * @param {Object} req.body - päivitettävät merkintätiedot
 * @param {string} req.body.pvm - merkinnän päivämäärä muodossa YYYY-MM-DD
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Object} JSON-vastaus päivityksen onnistumisesta
 */
const updateEntry = async (req, res, next) => {
  // haetaan käyttäjän ID autentikointitiedoista
  const kayttajaId = req.user.kayttaja_id;
  let kirjausData = req.body;

  logger.debug(`Update request for date: ${kirjausData.pvm}`, kirjausData);

  // varmistetaan että päivämäärä on annettu (pakollinen kenttä)
  if (!kirjausData.pvm) {
      return next(createValidationError('Päivämäärä (pvm) vaaditaan'));
  }

  try {
    // määritellään verensokeriarvoja sisältävät kentät
      const numericFields = [
          'vs_aamu', 'vs_ilta',
          'vs_aamupala_ennen', 'vs_aamupala_jalkeen',
          'vs_lounas_ennen', 'vs_lounas_jalkeen',
          'vs_valipala_ennen', 'vs_valipala_jalkeen',
          'vs_paivallinen_ennen', 'vs_paivallinen_jalkeen',
          'vs_iltapala_ennen', 'vs_iltapala_jalkeen'
      ];

      // käsitellään tyhjät ja määrittelemättömät arvot nulleiksi tietokantaa varten
      kirjausData = processFieldValues(kirjausData, numericFields);

      logger.debug("Processed data for update", kirjausData);

      // päivitetään merkintä tietokantaan
      const result = await updateKirjaus(kayttajaId, kirjausData);

      // palautetaan onnistumisviesti ja vaikutettujen rivien määrä
      res.json(createResponse({
          affectedRows: result.affectedRows || 1
      }, 'Kirjaus päivitetty onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      // virhetilanteessa lokitetaan virhe ja siirretään se käsittelijälle
      logger.error("Error in updateEntry", error);
      next(createDatabaseError("Kirjauksen päivittäminen epäonnistui", error));
  }
};

/**
 * poistaa merkinnän tietokannasta annetulta päivämäärältä.
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää poistettavan merkinnän tiedot
 * @param {Object} req.user - autentikoitu käyttäjäobjekti
 * @param {number} req.user.kayttaja_id - käyttäjän ID tietokannassa
 * @param {Object} req.params - URL-parametrit
 * @param {string} req.params.date - poistettavan merkinnän päivämäärä muodossa YYYY-MM-DD
 * @param {Response} res - HTTP-vastausobjekti asiakkaalle vastaamiseen
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {Object} JSON-vastaus poiston onnistumisesta sisältäen vaikutettujen rivien määrän
 */
const deleteEntry = async (req, res, next) => {
  // haetaan käyttäjän ID autentikointitiedoista
  const kayttajaId = req.user.kayttaja_id;
  // haetaan poistettavan merkinnän päivämäärä URL-parametreista
  const date = req.params.date;

  logger.debug(`Delete request for date: ${date}`);

  // varmistetaan että päivämäärä on annettu (pakollinen kenttä)
  if (!date) {
      return next(createValidationError('Päivämäärä (date) vaaditaan'));
  }

  try {
      // yritetään poistaa merkintä tietokannasta
      const result = await deleteKirjaus(kayttajaId, date);

      // tarkistetaan onnistuiko poisto (vaikuttiko yhteenkään riviin)
      if (result.affectedRows === 0) {
          return next(createNotFoundError('Kirjausta ei löytynyt poistettavaksi'));
      }

      // palautetaan onnistumisviesti ja vaikutettujen rivien määrä
      res.json(createResponse({
          affectedRows: result.affectedRows
      }, 'Kirjaus poistettu onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      // virhetilanteessa lokitetaan virhe ja siirretään se keskitetylle käsittelijälle
      logger.error("Error in deleteEntry", error);
      next(createDatabaseError("Kirjauksen poistaminen epäonnistui", error));
  }
};

export { createEntry, getEntriesByMonth, updateEntry, deleteEntry };
