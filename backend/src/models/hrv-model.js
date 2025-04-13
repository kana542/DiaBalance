import promisePool from "../utils/database.js";
import { createDatabaseError } from "../middlewares/error-handler.js";

const storeHrvData = async (userId, date, hrvData) => {
   try {
      console.log(`Storing HRV data for user ${userId} on date ${date}`);

      // First check if an entry exists for this date
      const [entries] = await promisePool.query(
         "SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?",
         [userId, date]
      );

      if (entries.length === 0) {
         // We need an entry for this date first - create a placeholder entry
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

      // Check if HRV data already exists
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
         // Update existing HRV data
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
         // Insert new HRV data
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
