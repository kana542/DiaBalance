/**
 * database.js - tietokantayhteyden hallinta
 * -----------
 * luo ja hallinnoi yhteyttä MySQL-tietokantaan connection pool -menetelmällä.
 * tarjoaa Promise-pohjaisen tietokantarajapinnan koko sovelluksen käyttöön.
 *
 * pääominaisuudet:
 *    1. tietokantayhteyden määrittely ympäristömuuttujien avulla (.env)
 *    2. yhteyspoolin toteutus (connection pool) suorituskyvyn optimoimiseksi
 *    3. Promise-pohjainen rajapinta asynkronisiin tietokantaoperaatioihin
 *
 * käyttö sovelluksessa:
 *    - tuodaan model-tiedostoihin tietokantakyselyitä varten
 *    - mahdollistaa asynkronisen tietokantakommunikaation async/await-syntaksilla
 *    - toimii keskitettynä tietokantarajapintana, jolloin yhteysasetuksia ei tarvitse määritellä erikseen jokaisessa tiedostossa
 */

import mysql from "mysql2";
import "dotenv/config";
import logger from "./logger.js";

// luodaan tietokantayhteyksien pooli suorituskyvyn optimoimiseksi
const pool = mysql.createPool({
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
});

// muutetaan pooli Promise-pohjaiseksi
const promisePool = pool.promise();

// suorittaa tietokantakyselyn ja palauttaa tulokset
export const executeQuery = async (
   query,
   params = [],
   errorMessage = "Tietokantavirhe"
) => {
   try {
      const [rows] = await promisePool.query(query, params);
      return rows;
   } catch (error) {
      logger.error(`Database error: ${errorMessage}`, error);
      throw new Error(errorMessage);
   }
};

// hakee yhden rivin tietokannasta ID:n perusteella
export const findById = async (table, idField, id) => {
   const rows = await executeQuery(
      `SELECT * FROM ${table} WHERE ${idField} = ?`,
      [id],
      `Virhe haettaessa taulusta ${table}`
   );
   return rows.length > 0 ? rows[0] : null;
};

// hakee kaikki rivit tietokannasta hakuehdoilla
export const findAll = async (table, whereClause = "", params = []) => {
   const query = `SELECT * FROM ${table} ${
      whereClause ? "WHERE " + whereClause : ""
   }`;
   return await executeQuery(
      query,
      params,
      `Virhe haettaessa taulusta ${table}`
   );
};

export default promisePool;
