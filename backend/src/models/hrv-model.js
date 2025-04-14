// hrv-model.js - HRV (Heart Rate Variability) -datan tallennus ja haku
// -------------
// Käsittelee käyttäjän HRV-tietojen tallennuksen ja haun tietokannasta.

import promisePool from "../utils/database.js";
import { createDatabaseError } from "../middlewares/error-handler.js";

/**
 * Tallentaa HRV-datan tietokantaan käyttäjän ID:n ja päivämäärän perusteella.
 * Jos kirjauspäivälle ei ole olemassa olevaa tietuetta kirjaus-taulussa, se luodaan automaattisesti ns. placeholder-rivinä.
 * Tämä tarkoittaa, että HRV-data voidaan tallentaa ilman että käyttäjä on lisännyt muita päiväkirjamerkintöjä.
 * @param {number} userId Käyttäjän ID
 * @param {string} date Päivämäärä muodossa YYYY-MM-DD
 * @description Tallettaa HRV-datan tietokantaan käyttäjän ID:n ja päivämäärän perusteella.
 * @param {object} hrvData HRV-data, joka sisältää seuraavat kentät:
 * - readiness: valmiusindeksi (float)
 * - stress: stressitaso (float)
 * - bpm: syke (int)
 * - sdnn_ms: SDNN (standard deviation of NN intervals) (float)
 * @returns {object} Tulosviesti tallennuksesta (onnistuiko)
 */
const storeHrvData = async (userId, date, hrvData) => {
   try {
      console.log(`Storing HRV data for user ${userId} on date ${date}`);

      // Ensin tarkistetaan onko jo kirjauksia olemassa kyseiselle päivälle
      const [entries] = await promisePool.query(
         "SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?",
         [userId, date]
      );

      if (entries.length === 0) {
         // Jos ei löydy merkintää, luodaan perusmerkintä
         // Tämä on tarpeen, jotta HRV-data voidaan tallentaa
         console.log(
            `Creating basic entry for date ${date} because HRV data requires it`
         );
         try {
            await promisePool.query(
               "INSERT INTO kirjaus (kayttaja_id, pvm, oireet, kommentti) VALUES (?, ?, ?, ?)",
               [userId, date, "Ei oireita", "HRV-datamerkintä"]
            );
         } catch (insertError) {
            console.error("Error creating placeholder entry:", insertError);
            return { error: true, message: "Failed to create required entry" };
         }
      }

      //tarkistaa löytyy hrv_kirjaus-taulusta jo merkintä tälle päivälle
      // Jos löytyy, päivittää sen, muuten luo uuden merkinnän
      const [existing] = await promisePool.query(
         "SELECT 1 FROM hrv_kirjaus WHERE kayttaja_id = ? AND pvm = ?",
         [userId, date]
      );

      const readiness =
         hrvData.readiness !== undefined ? parseFloat(hrvData.readiness) : null;
      const stress =
         hrvData.stress_index !== undefined
            ? parseFloat(hrvData.stress_index) : hrvData.stress !== undefined
            ? parseFloat(hrvData.stress) : null;
      const bpm =
         hrvData.mean_hr_bpm !== undefined
            ? parseInt(hrvData.mean_hr_bpm) : hrvData.bpm !== undefined
            ? parseInt(hrvData.bpm) : null;
      const sdnnMs =
         hrvData.sdnn_ms !== undefined
            ? parseFloat(hrvData.sdnn_ms) : hrvData.sdnnMs !== undefined
            ? parseFloat(hrvData.sdnnMs) : null;

      console.log("HRV values to store:", {
         readiness,
         stress,
         bpm,
         sdnnMs,
      });

      let result;
      if (existing.length > 0) {
         // Päivitetään olemassa oleva HRV-data
         [result] = await promisePool.query(
            "UPDATE hrv_kirjaus SET readiness = ?, stress = ?, bpm = ?, sdnn_ms = ? WHERE kayttaja_id = ? AND pvm = ?",
            [readiness, stress, bpm, sdnnMs, userId, date]
         );
         return {
            success: true,
            message: "HRV data updated",
            affectedRows: result.affectedRows,
         };
      } else {
         // Luodaan uusi HRV-data
         [result] = await promisePool.query(
            "INSERT INTO hrv_kirjaus (kayttaja_id, pvm, readiness, stress, bpm, sdnn_ms) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, date, readiness, stress, bpm, sdnnMs]
         );
         return {
            success: true,
            message: "HRV data stored",
            affectedRows: result.affectedRows,
         };
      }
   } catch (error) {
      console.error("Error storing HRV data:", error);
      throw createDatabaseError("Database error storing HRV data", error);
   }
};


/**
 * 
 * @param {number} userId käyttäjän ID
 * @param {string} date päivämäärä muodossa YYYY-MM-DD
 * @returns {object | null} HRV-data tai null, jos ei löydy
 */
const getHrvData = async (userId, date) => {
   try {
      const [rows] = await promisePool.query(
         "SELECT * FROM hrv_kirjaus WHERE kayttaja_id = ? AND pvm = ?",
         [userId, date]
      );

      return rows.length > 0 ? rows[0] : null;
   } catch (error) {
      console.error("Error getting HRV data:", error);
      throw createDatabaseError("Database error getting HRV data", error);
   }
};

export { storeHrvData, getHrvData };
