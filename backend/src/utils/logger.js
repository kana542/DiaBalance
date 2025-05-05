/**
 * logger.js - simppeli lokitusjärjestelmä
 * -----------
 * helppokäyttöinen lokitusmekanismi eri tasoisten viestien kirjaamiseen.
 * tehty periaatteessa siis kehittäjiä seuraamaan sovelluksen toimintaa ja virhetilanteita.
 *
 * pääominaisuudet:
 *    1. eritasoiset lokit (error, warn, info, debug) eri käyttötarkoituksiin
 *    2. ympäristökohtaiset lokitustasot (tuotanto vs. kehitys)
 *    3. automaattinen arkaluontoisten tietojen puhdistus ennen lokitusta
 *    4. yksinkertainen rajapinta käytettäväksi kaikkialla sovelluksessa
 *
 * keskeiset toiminnot:
 *    - error() - vakavien virhetilanteiden kirjaaminen
 *    - warn() - varoitusten ja potentiaalisten ongelmien kirjaaminen
 *    - info() - yleisten tapahtumatietojen kirjaaminen
 *    - debug() - kehitysaikaisten yksityiskohtien kirjaaminen
 *
 * käyttö sovelluksessa:
 *    - tuodaan logger muihin moduuleihin tarpeen mukaan
 *    - käytetään sopivaa lokitustasoa tilanteen vakavuuden mukaan
 *    - voidaan lokittaa sekä tekstiviestejä että dataobjekteja
 */

// määritellään lokitustasot hierarkkisesti numeroarvoilla
const LOG_LEVELS = {
   ERROR: 0, // vakavimmat virheet
   WARN: 1, // varoitukset
   INFO: 2, // yleiset infot
   DEBUG: 3, // kehitysaikaiset debug-viestit
};

// asetetaan lokitustaso ympäristömuuttujan perusteella
const CURRENT_LOG_LEVEL =
   process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// lokitusobjekti eri tasoisten viestien käsittelyyn
const logger = {
   // virhetason lokit
   error: (message, error) => {
      if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
         console.error(
            `[ERROR] ${message}`,
            error ? error.message || error : ""
         );
      }
   },

   // varoitustason lokit
   warn: (message) => {
      if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
         console.warn(`[WARN] ${message}`);
      }
   },

   // informaatiotason lokit
   info: (message) => {
      if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
         console.log(`[INFO] ${message}`);
      }
   },

   // debug-tason lokit ja mahdolliset lisädatat
   debug: (message, data) => {
      if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
         console.log(`[DEBUG] ${message}`);
         if (data && CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
            console.log(
               typeof data === "object" ? cleanSensitiveData(data) : data
            );
         }
      }
   },
};

// arkaluontoisten tietojen poisto objekteista ennen lokitusta
function cleanSensitiveData(obj) {
   if (!obj) return obj;

   const sensitiveFields = [
      "token",
      "password",
      "salasana",
      "authorization",
      "idToken",
      "kubiosIdToken",
   ];

   const cleanedObj = { ...obj };

   sensitiveFields.forEach((field) => {
      if (field in cleanedObj) {
         cleanedObj[field] = "***REDACTED***";
      }
   });

   return cleanedObj;
}

export default logger;
