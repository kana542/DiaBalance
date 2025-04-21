/**
 * entry-models.js - diabeteskirjausten tallennus ja haku
 * -------------------
 * Sisältää kaikki tietokantatoiminnot, jotka liittyvät käyttäjän kirjaamiin verensokeri- ja oiremerkintöihin.
 * Käytetään entry-controller.js-tiedostossa merkintöjen hallintaan.
 *
 * pääominaisuudet:
 *    1. verensokerimerkintöjen lisäys, päivitys, haku ja poisto tietokannasta
 *    2. kenttäarvojen validointi ja tyhjien arvojen oikeaoppinen käsittely
 *    3. tietokantakyselyjen optimointi ja virheidenkäsittely
 *    4. merkintöjen hakeminen aikaperusteisesti (kuukausi, päivä)
 *
 * keskeiset toiminnot:
 *    - insertKirjaus() - lisää uuden merkinnän tietokantaan
 *    - getKirjauksetByMonth() - hakee tietyn kuukauden merkinnät
 *    - updateKirjaus() - päivittää merkinnän tai luo uuden tarvittaessa
 *    - deleteKirjaus() - poistaa merkinnän tietokannasta
 *
 * käyttö sovelluksessa:
 *    - toimii tietokantalayer-tasona entry-controller.js -tiedostolle
 *    - erottaa tietokantaoperaatiot sovelluslogiikasta
 *    - vastaa tietoturvallisesta datan tallennuksesta ja validoinnista
 */

import promisePool from '../utils/database.js';
import { executeQuery } from '../utils/database.js';
import logger from "../utils/logger.js"

/**
 * Tarkistaa merkinnän kenttäarvot
 * @param {Object} data - Merkintädata
 * @returns {Object} Tarkistettu data
 */
const validateEntryData = (data) => {
  // Varmista että jokainen kenttä on oikean tyyppinen
  const validated = { ...data };

  // Varmista että oireet ja kommentit ovat aina oletusarvoisesti määritelty
  validated.oireet = data.oireet || 'Ei oireita';
  validated.kommentti = data.kommentti || 'Ei kommentteja';

  return validated;
};

/**
 * Lisää uusi kirjaus tietokantaan tauluun kirjaus
 * Tallennetaan kättäjän ID:n  ja yksittäisen päivän tiedot kuten verensokeritiedot, oireet ja kommentit
 * @param {number} kayttajaId
 * @param {object} data
 * @returns
 */
const insertKirjaus = async (kayttajaId, data) => {
  try {
    const validatedData = validateEntryData(data);

    const [result] = await promisePool.query(
      `INSERT INTO kirjaus
        (kayttaja_id, pvm, vs_aamu, vs_ilta, vs_aamupala_ennen, vs_aamupala_jalkeen, vs_lounas_ennen, vs_lounas_jalkeen, vs_valipala_ennen, vs_valipala_jalkeen, vs_paivallinen_ennen, vs_paivallinen_jalkeen, vs_iltapala_ennen, vs_iltapala_jalkeen, oireet, kommentti)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kayttajaId,
        validatedData.pvm,
        validatedData.vs_aamu,
        validatedData.vs_ilta,
        validatedData.vs_aamupala_ennen,
        validatedData.vs_aamupala_jalkeen,
        validatedData.vs_lounas_ennen,
        validatedData.vs_lounas_jalkeen,
        validatedData.vs_valipala_ennen,
        validatedData.vs_valipala_jalkeen,
        validatedData.vs_paivallinen_ennen,
        validatedData.vs_paivallinen_jalkeen,
        validatedData.vs_iltapala_ennen,
        validatedData.vs_iltapala_jalkeen,
        validatedData.oireet,
        validatedData.kommentti,
      ],
    );
    return result;
  } catch (error) {
    logger.error('Error insertKirjaus', error);
    throw new Error('Tietokantavirhe kirjauksen lisäämisessä');
  }
};

/**
 * Hakee kaikki merkinnät tietylle käyttäjälle tietyltä kuukaudelta ja vuodelta
 * @param {number} kayttajaId Käyttäjän ID
 * @param {number} year Vuosi (esim. 2025)
 * @param {number} month kuukausi (1-12)
 * @returns {Array} Merkinnät
 */
const getKirjauksetByMonth = async (kayttajaId, year, month) => {
  try {
    logger.debug(`Running query for user ${kayttajaId}, year ${year}, month ${month}`);

    // Käytä DATE_FORMAT varmistamaan että päivämäärä on samassa muodossa
    return await executeQuery(
      `SELECT
         *,
         DATE_FORMAT(pvm, '%Y-%m-%d') AS formatted_date
       FROM kirjaus
       WHERE kayttaja_id = ?
       AND YEAR(pvm) = ?
       AND MONTH(pvm) = ?
       ORDER BY pvm`,
      [kayttajaId, year, month],
      'Tietokantavirhe kirjausten hakemisessa'
    );
  } catch (error) {
    logger.error('Error getKirjauksetByMonth', error);
    throw new Error('Tietokantavirhe kirjausten hakemisessa');
  }
};

/**
 * Päivittää olemassa olevan kirjauksen tai luo uuden jos sitä ei ole
 * @param {number} kayttajaId - Käyttäjän ID
 * @param {object} data - Kirjaustiedot
 * @returns {Object} Päivityksen tulos
 */
const updateKirjaus = async (kayttajaId, data) => {
  try {
    logger.debug(`Updating entry for date ${data.pvm}`);
    const validatedData = validateEntryData(data);

    // Tarkista onko kirjaus jo olemassa
    const [checkResult] = await promisePool.query(
      'SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, validatedData.pvm]
    );

    if (checkResult.length === 0) {
      // Kirjausta ei ole olemassa, luodaan uusi
      logger.debug("Entry doesn't exist, creating new one");
      return await insertKirjaus(kayttajaId, validatedData);
    }

    // Kirjaus on olemassa, päivitetään
    logger.debug("Entry exists, updating");
    const [result] = await promisePool.query(
      `UPDATE kirjaus
       SET vs_aamu = ?,
           vs_ilta = ?,
           vs_aamupala_ennen = ?,
           vs_aamupala_jalkeen = ?,
           vs_lounas_ennen = ?,
           vs_lounas_jalkeen = ?,
           vs_valipala_ennen = ?,
           vs_valipala_jalkeen = ?,
           vs_paivallinen_ennen = ?,
           vs_paivallinen_jalkeen = ?,
           vs_iltapala_ennen = ?,
           vs_iltapala_jalkeen = ?,
           oireet = ?,
           kommentti = ?
       WHERE kayttaja_id = ? AND pvm = ?`,
      [
        validatedData.vs_aamu,
        validatedData.vs_ilta,
        validatedData.vs_aamupala_ennen,
        validatedData.vs_aamupala_jalkeen,
        validatedData.vs_lounas_ennen,
        validatedData.vs_lounas_jalkeen,
        validatedData.vs_valipala_ennen,
        validatedData.vs_valipala_jalkeen,
        validatedData.vs_paivallinen_ennen,
        validatedData.vs_paivallinen_jalkeen,
        validatedData.vs_iltapala_ennen,
        validatedData.vs_iltapala_jalkeen,
        validatedData.oireet,
        validatedData.kommentti,
        kayttajaId,
        validatedData.pvm
      ]
    );
    return result;
  } catch (error) {
    logger.error('Error updateKirjaus', error);
    throw new Error('Tietokantavirhe kirjauksen päivittämisessä');
  }
};

/**
 * Poistaa merkinnän tietokannasta
 * @param {number} kayttajaId - Käyttäjän ID
 * @param {string} pvm - päivämäärä muodossa YYYY-MM-DD
 * @returns {Object} Poiston tulos
 */
const deleteKirjaus = async (kayttajaId, pvm) => {
  try {
    logger.debug(`Deleting entry for date ${pvm}`);

    return await executeQuery(
      'DELETE FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, pvm],
      'Tietokantavirhe kirjauksen poistamisessa'
    );
  } catch (error) {
    logger.error('Error deleteKirjaus', error);
    throw new Error('Tietokantavirhe kirjauksen poistamisessa');
  }
};

export {insertKirjaus, getKirjauksetByMonth, updateKirjaus, deleteKirjaus};
