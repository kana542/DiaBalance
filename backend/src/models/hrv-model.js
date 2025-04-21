/**
 * hrv-model.js - HRV (Heart Rate Variability) -datan tallennus ja haku
 * -------------
 * Käsittelee käyttäjän HRV-tietojen tallennuksen ja haun tietokannasta.
 * Toimii rajapintana kubios-controller.js:n ja tietokannan välillä.
 *
 * pääominaisuudet:
 *    1. HRV-datan muotoilu ja validointi tietokantaan tallentamista varten
 *    2. HRV-tietueiden luominen, päivittäminen ja hakeminen päivämäärän perusteella
 *    3. tietokantaoperaatioiden kapselointi ja virheenkäsittely
 *    4. HRV-mittaustulosten käsittely (readiness, stress, bpm, sdnn_ms)
 *
 * keskeiset toiminnot:
 *    - storeHrvData() - tallentaa HRV-datan tietokantaan käyttäjä/päivä -kohtaisesti
 *    - getHrvData() - hakee HRV-datan tietokannasta tietylle päivämäärälle
 *    - formatHrvData() - muotoilee HRV-datan yhdenmukaiseksi tallennusta varten
 *    - createHrvData()/updateHrvData() - luo tai päivittää HRV-mittaustulokset
 *
 * käyttö sovelluksessa:
 *    - mahdollistaa Kubios-palvelun HRV-mittaustulosten integroinnin osaksi sovellusta
 *    - tukee diabetesmerkintöjen täydentämistä HRV-datalla kokonaisvaltaista seurantaa varten
 *    - tarjoaa tietoturvallisen ja luotettavan tavan tallentaa ja käsitellä terveystietoja
 */

import promisePool from "../utils/database.js";
import { executeQuery } from "../utils/database.js";
import { createDatabaseError } from "../middlewares/error-handler.js";
import logger from "../utils/logger.js"

/**
 * Muotoilee HRV-datan tallennusta varten
 * @param {Object} hrvData - HRV-data
 * @returns {Object} Muotoiltu data
 */
const formatHrvData = (hrvData) => {
   return {
      readiness:
         hrvData.readiness !== undefined ? parseFloat(hrvData.readiness) : null,
      stress:
         hrvData.stress_index !== undefined
            ? parseFloat(hrvData.stress_index)
            : hrvData.stress !== undefined
            ? parseFloat(hrvData.stress)
            : null,
      bpm:
         hrvData.mean_hr_bpm !== undefined
            ? parseInt(hrvData.mean_hr_bpm)
            : hrvData.bpm !== undefined
            ? parseInt(hrvData.bpm)
            : null,
      sdnn_ms:
         hrvData.sdnn_ms !== undefined
            ? parseFloat(hrvData.sdnn_ms)
            : hrvData.sdnnMs !== undefined
            ? parseFloat(hrvData.sdnnMs)
            : null,
   };
};

/**
 * Tarkistaa onko HRV-data jo olemassa
 * @param {number} userId - Käyttäjän ID
 * @param {string} date - Päivämäärä
 * @returns {Promise<boolean>} Onko data olemassa
 */
const hrvDataExists = async (userId, date) => {
   const [existing] = await promisePool.query(
      "SELECT 1 FROM hrv_kirjaus WHERE kayttaja_id = ? AND pvm = ?",
      [userId, date]
   );
   return existing.length > 0;
};

/**
 * Päivittää olemassa olevan HRV-datan
 * @param {number} userId - Käyttäjän ID
 * @param {string} date - Päivämäärä
 * @param {Object} formattedData - Muotoiltu HRV-data
 * @returns {Promise<Object>} Päivityksen tulos
 */
const updateHrvData = async (userId, date, formattedData) => {
   const [result] = await promisePool.query(
      "UPDATE hrv_kirjaus SET readiness = ?, stress = ?, bpm = ?, sdnn_ms = ? WHERE kayttaja_id = ? AND pvm = ?",
      [
         formattedData.readiness,
         formattedData.stress,
         formattedData.bpm,
         formattedData.sdnn_ms,
         userId,
         date,
      ]
   );
   return {
      success: true,
      message: "HRV data updated",
      affectedRows: result.affectedRows,
   };
};

/**
 * Luo uuden HRV-datan
 * @param {number} userId - Käyttäjän ID
 * @param {string} date - Päivämäärä
 * @param {Object} formattedData - Muotoiltu HRV-data
 * @returns {Promise<Object>} Lisäyksen tulos
 */
const createHrvData = async (userId, date, formattedData) => {
   const [result] = await promisePool.query(
      "INSERT INTO hrv_kirjaus (kayttaja_id, pvm, readiness, stress, bpm, sdnn_ms) VALUES (?, ?, ?, ?, ?, ?)",
      [
         userId,
         date,
         formattedData.readiness,
         formattedData.stress,
         formattedData.bpm,
         formattedData.sdnn_ms,
      ]
   );
   return {
      success: true,
      message: "HRV data stored",
      affectedRows: result.affectedRows,
   };
};

/**
 * Tallentaa HRV-datan tietokantaan käyttäjän ID:n ja päivämäärän perusteella.
 * Jos kirjauspäivälle ei ole olemassa olevaa tietuetta kirjaus-taulussa, se luodaan automaattisesti.
 * @param {number} userId Käyttäjän ID
 * @param {string} date Päivämäärä muodossa YYYY-MM-DD
 * @param {object} hrvData HRV-data
 * @returns {object} Tulosviesti tallennuksesta
 */
const storeHrvData = async (userId, date, hrvData) => {
   try {
      logger.debug(`Storing HRV data for user ${userId} on date ${date}`);

      // Muotoile data
      const formattedData = formatHrvData(hrvData);

      logger.debug("HRV values to store", formattedData);

      // Tarkista onko jo olemassa oleva HRV-data
      const exists = await hrvDataExists(userId, date);

      // Päivitä tai luo uusi merkintä
      if (exists) {
         return await updateHrvData(userId, date, formattedData);
      } else {
         return await createHrvData(userId, date, formattedData);
      }
   } catch (error) {
      logger.error("Error storing HRV data", error);
      throw createDatabaseError("Database error storing HRV data", error);
   }
};

/**
 * Hakee HRV-datan käyttäjälle tietyltä päivältä
 * @param {number} userId käyttäjän ID
 * @param {string} date päivämäärä muodossa YYYY-MM-DD
 * @returns {object | null} HRV-data tai null, jos ei löydy
 */
const getHrvData = async (userId, date) => {
   try {
      return await executeQuery(
         "SELECT * FROM hrv_kirjaus WHERE kayttaja_id = ? AND pvm = ?",
         [userId, date],
         "Database error getting HRV data"
      ).then((rows) => (rows.length > 0 ? rows[0] : null));
   } catch (error) {
      logger.error("Error getting HRV data", error);
      throw createDatabaseError("Database error getting HRV data", error);
   }
};

export { storeHrvData, getHrvData };
