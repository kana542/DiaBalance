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

import mysql from 'mysql2';
import 'dotenv/config';

/**
 * luodaan tietokantayhteyksien pooli suorituskyvyn optimoimiseksi
 * poolatut yhteyksillä mahdollistetaan useamman samanaikaisen tietokantakyselyn ilman jatkuvaa yhteyden avaamista ja sulkemista
 */
const pool = mysql.createPool({
  // Tietokanta-asetukset ladataan ympäristömuuttujista (.env)
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Yhteyspooliin liittyvät asetukset
  waitForConnections: true,  // Odottaa vapaata yhteyttä jos kaikki ovat käytössä
  connectionLimit: 10,       // Maksimi yhteyksien määrä poolissa
  queueLimit: 0,             // Ei rajoitusta jonossa oleville yhteyspyynnöille
});

/**
 * muunnetaan perinteinen callback-pohjainen pooli Promise-pohjaiseksi, mikä mahdollistaa async/await-syntaksin käytön tietokantaoperaatioissa
 */
const promisePool = pool.promise();

// viedään Promise-pohjainen yhteyspooli muiden moduulien käyttöön
export default promisePool;
