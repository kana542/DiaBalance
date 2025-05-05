/**
 * user-model.js - käyttäjätietojen hallinta ja autentikointiin liittyvät toiminnot
 * --------------
 * Sisältää toiminnot käyttäjän luontiin, kirjautumiseen, tietojen päivittämiseen sekä Kubios-tokenin käsittelyyn.
 * Käytetään auth-controller.js, user-controller.js ja kubios-controller.js -tiedostoissa.
 *
 * pääominaisuudet:
 *    1. käyttäjätilien hallinta tietokannassa (rekisteröinti, kirjautuminen, tietojen päivitys)
 *    2. Kubios-tokenien tallennus, haku ja poisto tietokannasta sekä välimuistista
 *    3. käyttäjäprofiilin tietojen hallinta ja päivitys
 *    4. tietokantaoperaatioiden kapselointi ja virheenkäsittely
 *
 * keskeiset toiminnot:
 *    - registerUser() - luo uuden käyttäjän tietokantaan
 *    - loginUser() - hakee käyttäjän tiedot kirjautumista varten
 *    - getMyProfile() - hakee kirjautuneen käyttäjän profiilin
 *    - updateMyProfile() - päivittää käyttäjän tiedot
 *    - updateKubiosToken() - tallentaa Kubios-tokenin käyttäjälle
 *    - getKubiosToken() - hakee voimassaolevan Kubios-tokenin
 *    - removeKubiosToken() - poistaa Kubios-tokenin uloskirjautuessa
 *
 * käyttö sovelluksessa:
 *    - toimii tietokantalayer-tasona autentikaatio- ja käyttäjätietoja käsitteleville kontrollereille
 *    - mahdollistaa turvallisen käyttäjähallinnan ja autentikaation
 *    - integroi Kubios-tokenien hallinnan osaksi käyttäjätietojärjestelmää
 */

import promisePool from "../utils/database.js";
import { executeQuery } from "../utils/database.js";
import {
   cacheToken,
   getTokenFromCache,
   removeTokenFromCache,
} from "../utils/token-cache.js";
import logger from "../utils/logger.js";

/**
 * rekisteröi uuden käyttäjän tietokantaan
 * @param {Object} user - käyttäjän tiedot
 * @param {string} user.kayttajanimi - käyttäjän tunnus järjestelmässä
 * @param {string} [user.email] - käyttäjän sähköpostiosoite (valinnainen)
 * @param {string} user.salasana - salattu salasana (oletetaan että salaus on tehty kutsussa)
 * @param {number} user.kayttajarooli - käyttäjän rooli järjestelmässä (0=normaali, 1=hoitaja, 2=admin)
 * @returns {number} luodun käyttäjän ID tietokannassa
 * @throws {Error} tietokantavirheen tapahtuessa
 */
const registerUser = async (user) => {
   try {
      // suoritetaan SQL-kysely käyttäjän tietojen lisäämiseksi tietokantaan
      const [result] = await promisePool.query(
         "INSERT INTO kayttaja (kayttajanimi, email, salasana, kayttajarooli) VALUES (?, ?, ?, ?)",
         [
            user.kayttajanimi,
            user.email || null, // käsitellään mahdollisesti puuttuva sähköposti
            user.salasana,
            user.kayttajarooli,
         ]
      );
      // palautetaan tietokannan generoima uuden käyttäjän ID
      return result.insertId;
   } catch (error) {
      // lokitetaan virhe ja heitetään yksinkertaistettu virheilmoitus
      logger.error("Error registerUser", error);
      throw new Error("Database error");
   }
};

/**
 * hakee käyttäjän kirjautumistiedot tietokannasta käyttäjänimen perusteella
 * @param {string} kayttajanimi - käyttäjän tunnus
 * @returns {Object|null} käyttäjän tiedot salasanoineen tai null jos käyttäjää ei löydy
 * @throws {Error} tietokantavirheen tapahtuessa
 */
const loginUser = async (kayttajanimi) => {
   try {
      // haetaan käyttäjän tiedot mukaan lukien salattu salasana autentikointia varten
      return await executeQuery(
         "SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?",
         [kayttajanimi],
         "Error loginUser"
      ).then((rows) => rows[0] || null);
   } catch (error) {
      // lokitetaan virhe ja heitetään yksinkertaistettu virheilmoitus
      logger.error("Error loginUser", error);
      throw new Error("Database error");
   }
};

/**
 * hakee käyttäjän profiilitiedot tietokannasta ID:n perusteella
 * @param {number} kayttajaId - haettavan käyttäjän ID
 * @returns {Object|null} käyttäjän perustiedot tai null jos käyttäjää ei löydy
 * @throws {Error} tietokantavirheen tapahtuessa
 */
const getMyProfile = async (kayttajaId) => {
   try {
      // haetaan vain tarpeelliset tiedot (ei salasanaa) tietoturvasyistä
      return await executeQuery(
         "SELECT kayttaja_id, kayttajanimi, email, kayttajarooli FROM kayttaja WHERE kayttaja_id = ?",
         [kayttajaId],
         "Error getMyProfile"
      ).then((rows) => rows[0] || null); // palautetaan ensimmäinen rivi tai null jos ei löydy
   } catch (error) {
      // lokitetaan virhe ja heitetään yksinkertaistettu virheilmoitus
      logger.error("Error getMyProfile", error);
      throw new Error("Database error");
   }
};

/**
 * päivittää käyttäjän profiilitiedot tietokantaan
 * @param {number} kayttajaId - päivitettävän käyttäjän ID
 * @param {Object} data - päivitettävät tiedot
 * @param {string} [data.kayttajanimi] - uusi käyttäjänimi
 * @param {string} [data.email] - uusi sähköpostiosoite
 * @param {string} [data.salasana] - uusi salasana (oletetaan että on jo salattu)
 * @returns {Object} vastausobjekti, joka sisältää joko virheilmoituksen tai onnistumisviestin
 *   onnistuessa: { message: string, affectedRows: number }
 *   epäonnistuessa: { error: string }
 * @throws {Error} tietokantavirheen tapahtuessa
 */
const updateMyProfile = async (kayttajaId, data) => {
   try {
      // alustetaan taulukot SQL-lauseen osia ja parametreja varten
      const updateFields = [];
      const values = [];

      // lisätään käyttäjänimi päivitettäviin kenttiin jos se on annettu
      if (data.kayttajanimi) {
         updateFields.push("kayttajanimi = ?");
         values.push(data.kayttajanimi);
      }

      // lisätään sähköposti päivitettäviin kenttiin jos se on annettu
      if (data.email) {
         updateFields.push("email = ?");
         values.push(data.email);
      }

      // lisätään salasana päivitettäviin kenttiin jos se on annettu
      if (data.salasana) {
         updateFields.push("salasana = ?");
         values.push(data.salasana);
      }

      // tarkistetaan että vähintään yksi kenttä on päivitettävänä
      if (updateFields.length === 0) {
         return { error: "Ei päivitettäviä kenttiä" };
      }

      // lisätään käyttäjän ID parametreihin WHERE-ehtoa varten
      values.push(kayttajaId);

      // suoritetaan SQL-kysely dynaamisesti luodulla päivityslauseella
      const [result] = await promisePool.query(
         `UPDATE kayttaja SET ${updateFields.join(", ")} WHERE kayttaja_id = ?`,
         values
      );

      // palautetaan onnistumisviesti ja vaikutettujen rivien määrä
      return {
         message: "Tiedot päivitetty onnistuneesti",
         affectedRows: result.affectedRows,
      };
   } catch (error) {
      // lokitetaan virhe ja heitetään yksinkertaistettu virheilmoitus
      logger.error("Error updateMyProfile", error);
      throw new Error("Database error");
   }
};

/**
 * hallitsee Kubios-tokenien elinkaarta (tallennus, haku, poisto)
 * @param {number} userId - käyttäjän tunniste
 * @param {string} action - suoritettava toiminto: 'set', 'get' tai 'remove'
 * @param {string|null} token - Kubios-token (vaaditaan 'set'-toiminnolle)
 * @param {number|null} expiresIn - tokenin voimassaoloaika sekunteina (vaaditaan 'set'-toiminnolle)
 * @returns {boolean|string|null} toiminnon tulos:
 *   - 'set': boolean (onnistuiko tallennus)
 *   - 'get': string (token) tai null (jos ei löydy/vanhentunut)
 *   - 'remove': boolean (onnistuiko poisto)
 * @throws {Error} jos toiminto epäonnistuu tai parametrit ovat virheellisiä
 */
const manageKubiosToken = async (
   userId,
   action,
   token = null,
   expiresIn = null
) => {
   try {
      switch (action) {
         case "set":
            // varmista että token ja vanhenemisaika on annettu
            if (!token || !expiresIn) {
               throw new Error("Token and expiresIn required for set action");
            }

            // laske tokenin vanhenemisajankohta
            const expirationDate = new Date();
            expirationDate.setSeconds(
               expirationDate.getSeconds() + parseInt(expiresIn)
            );

            // tallenna token ja vanhenemisaika tietokantaan
            const [setResult] = await promisePool.query(
               "UPDATE kayttaja SET kubios_token = ?, kubios_expiration = ? WHERE kayttaja_id = ?",
               [token, expirationDate, userId]
            );

            // tallenna token myös välimuistiin suorituskyvyn parantamiseksi
            cacheToken(userId, token, expirationDate);

            // palauta tieto onnistuiko tallennus (true/false)
            return setResult.affectedRows > 0;

         case "get":
            // optimointi: tarkista ensin nopeasta välimuistista
            const cachedToken = getTokenFromCache(userId);
            if (cachedToken) return cachedToken;

            // jos ei löydy välimuistista, hae tietokannasta
            const [getRows] = await promisePool.query(
               "SELECT kubios_token, kubios_expiration FROM kayttaja WHERE kayttaja_id = ?",
               [userId]
            );

            // jos käyttäjää ei löydy, palauta null
            if (getRows.length === 0) return null;

            // hae token ja vanhenemisaika kyselyn tuloksista
            const dbToken = getRows[0].kubios_token;
            const expiration = getRows[0].kubios_expiration;

            // jos tokenia ei ole tai vanhenemisaikaa ei ole asetettu, palauta null
            if (!dbToken || !expiration) return null;

            // tarkista onko token vanhentunut
            const now = new Date();
            const expirationDate2 = new Date(expiration);

            // palauta null jos token on vanhentunut tai vanhenee 5 minuutin sisällä
            if (
               expirationDate2 <= now ||
               expirationDate2 - now < 5 * 60 * 1000
            ) {
               return null;
            }

            // välimuistita token tulevaa käyttöä varten ja palauta se
            cacheToken(userId, dbToken, expirationDate2);
            return dbToken;

         case "remove":
            // poista token tietokannasta asettamalla kenttä NULL-arvoksi
            await promisePool.query(
               "UPDATE kayttaja SET kubios_token = NULL, kubios_expiration = NULL WHERE kayttaja_id = ?",
               [userId]
            );

            // poista token myös välimuistista
            removeTokenFromCache(userId);
            return true;

         default:
            // heitetään virhe jos toiminto ei ole tuettu (ei 'set', 'get' tai 'remove')
            throw new Error(`Unknown action: ${action}`);
      }
   } catch (error) {
      // lokataan virhe ja heitetään uusi selkeämmällä viestillä
      logger.error(`Error in manageKubiosToken (${action})`, error);
      throw new Error(`Database error in token management: ${error.message}`);
   }
};

// päivitä kubios-token ja vanhentumisaika käyttäjälle
const updateKubiosToken = async (userId, token, expiresIn) => {
   logger.debug(`Updating Kubios token for user ${userId}`);
   return await manageKubiosToken(userId, "set", token, expiresIn);
};

// hae kubios-token käyttäjälle
const getKubiosToken = async (userId) => {
   return await manageKubiosToken(userId, "get");
};

// poista kubios-token käyttäjältä
const removeKubiosToken = async (userId) => {
   logger.debug(`Removing Kubios token for user ${userId}`);
   return await manageKubiosToken(userId, "remove");
};

export {
   registerUser,
   loginUser,
   getMyProfile,
   updateMyProfile,
   updateKubiosToken,
   getKubiosToken,
   removeKubiosToken,
};
