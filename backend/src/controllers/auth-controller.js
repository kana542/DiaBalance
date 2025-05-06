/**
 * auth-controller.js - kirjautuminen ja käyttäjän autentikointi
 * -------------------
 * käsittelee käyttäjän sisään- ja uloskirjautumisen, tokenin validoinnin sekä oman profiilin haun.
 * käytetään auth-router.js -tiedoston kautta.
 *
 * pääominaisuudet:
 *    1. käyttäjän autentikointi bcrypt-salasanavertailulla
 *    2. JWT-tokenien generointi ja hallinta kirjautumistilan säilyttämiseksi
 *    3. Kubios-integraatio HRV-datan kirjautumisen käsittelyyn
 *    4. standardoitu virhe- ja vastausformaatti API-rajapinnassa
 *
 * keskeiset toiminnot:
 *    - authenticateUser() - tarkistaa käyttäjän tunnukset tietokantaa vasten
 *    - generateToken() - luo JWT-tokenin autentikoidulle käyttäjälle
 *    - login() - kirjaa käyttäjän sisään ja palauttaa JWT-tokenin ja käyttäjätiedot
 *    - logout() - kirjaa käyttäjän ulos ja poistaa Kubios-tokenin
 *    - getMe() - hakee kirjautuneen käyttäjän profiilin
 *    - validateToken() - tarkistaa JWT-tokenin voimassaolon
 *
 * käyttö sovelluksessa:
 *    - toimii autentikaation keskipisteenä frontend- ja backend-järjestelmien välillä
 *    - mahdollistaa turvallisen käyttäjäkohtaisen pääsyn rajapintoihin
 *    - integroi Kubios-kirjautumisen osaksi normaalia kirjautumisprosessia
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
   loginUser,
   getMyProfile,
   updateKubiosToken,
   removeKubiosToken,
} from "../models/user-model.js";
import {
   createResponse,
   createAuthenticationError,
   createValidationError,
   createNotFoundError,
   createDatabaseError,
   Severity,
} from "../middlewares/error-handler.js";
import { kubiosLogin } from "../controllers/kubios-auth-controller.js";
import logger from "../utils/logger.js"

/**
 * Autentikoi käyttäjän annetuilla tunnuksilla
 * @param {string} kayttajanimi - Käyttäjänimi tai sähköposti
 * @param {string} salasana - Salasana
 * @returns {Object} Käyttäjän tiedot tai heittää virheen
 */
const authenticateUser = async (kayttajanimi, salasana) => {
   if (!kayttajanimi || !salasana) {
      throw createValidationError("Käyttäjänimi ja salasana vaaditaan");
   }

   // Hakee käyttäjätiedot tietokannasta annetulla käyttäjänimellä tai sähköpostilla
   const user = await loginUser(kayttajanimi);
   if (!user) {
      throw createAuthenticationError("Virheellinen käyttäjätunnus");
   }

   // Vertaa salattua salasanaa käyttäjän antamaan salasanaan
const match = await bcrypt.compare(salasana, user.salasana);
if (!match) {
  throw createAuthenticationError("Virheellinen salasana");
}

   return user;
};

/**
 * Luo JWT-tokenin käyttäjälle
 * @param {Object} user - Käyttäjän tiedot
 * @returns {string} JWT-token
 */
const generateToken = (user) => {
   return jwt.sign(
      {
         kayttaja_id: user.kayttaja_id,
         kayttajarooli: user.kayttajarooli,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
   );
};

/**
 * Yrittää kirjautua Kubios-palveluun käyttäjän sähköpostilla
 * @param {Object} user - Käyttäjän tiedot
 * @param {string} salasana - Käyttäjän salasana
 * @returns {Object} Kubios-kirjautumisen tila
 */
const handleKubiosLogin = async (user, salasana) => {
   // alustetaan vastaustila oletusarvoilla
   let kubiosStatus = {
      success: false,
      message: "Kubios-kirjautumista ei yritetty",
   };

   try {
      // varmistetaan että käyttäjällä on sähköpostiosoite Kubios-kirjautumista varten
      if (user.email) {
         logger.info(`Attempting Kubios login for user ID: ${user.kayttaja_id}`);
         // kutsutaan Kubios-kirjautumistoimintoa sähköpostilla ja salasanalla
         const { idToken, expiresIn } = await kubiosLogin(user.email, salasana);

         // tallenna saatu token tietokantaan myöhempää käyttöä varten
         await updateKubiosToken(user.kayttaja_id, idToken, expiresIn);

         // päivitetään onnistuneen kirjautumisen tila
         kubiosStatus = {
            success: true,
            message: "Kubios-kirjautuminen onnistui",
         };

         logger.info(`Kubios login successful for user ID: ${user.kayttaja_id}`);
      } else {
         // jos sähköpostia ei ole, päivitetään tilatiedot sen mukaisesti
         logger.info(`Cannot attempt Kubios login - no email for user: ${user.kayttajanimi}`);
         kubiosStatus = {
            success: false,
            message:
               "Käyttäjällä ei ole sähköpostiosoitetta Kubios-kirjautumista varten",
         };
      }
   } catch (kubiosError) {
      // virhetilanteessa lokitetaan virhe ja päivitetään tilatiedot
      logger.error("Kubios login error", kubiosError);
      kubiosStatus = {
         success: false,
         message: kubiosError.message || "Kubios-kirjautuminen epäonnistui",
      };
   }

   return kubiosStatus;
};

/**
 * kirjautuu sisään käyttäjänimellä ja salasanalla.
 * jos onnistuu, palauttaa JWT-tokenin ja käyttäjätiedot (ilman salasanaa).
 * lisäksi yrittää kirjautua myös Kubios-palveluun, jos käyttäjällä on sähköposti.
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää kirjautumistiedot
 * @param {Object} req.body - pyynnön rungossa olevat tiedot JSON-muodossa
 * @param {string} req.body.kayttajanimi - käyttäjätunnus tai sähköpostiosoite
 * @param {string} req.body.salasana - käyttäjän salasana selkokielisenä
 * @param {Response} res - HTTP-vastausobjekti JSON-muodossa palauttamista varten
 * @param {Function} next - seuraava middleware-funktio virheenkäsittelyä varten
 * @returns {object} JSON-vastaus jossa token, käyttäjätiedot ja Kubios-kirjautumisen tila
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
   try {
      // poimitaan käyttäjänimi ja salasana pyynnön bodystä
      const { kayttajanimi, salasana } = req.body;

      // autentikoidaan käyttäjä vertaamalla salasanaa tietokannassa olevaan
      const user = await authenticateUser(kayttajanimi, salasana);

      // luodaan JWT-token autentikoitua käyttäjää varten
      const token = generateToken(user);

      // poistetaan salasana käyttäjäobjektista ennen clientille palauttamista
      delete user.salasana;

      // yritetään kirjautua Kubios-palveluun käyttäjän tiedoilla
      const kubiosStatus = await handleKubiosLogin(user, salasana);

      // palautetaan onnistunut vastaus, joka sisältää:
      res.json(
         createResponse(
            {
               token,
               user,
               kubios: kubiosStatus,
            },
            "Kirjautuminen onnistui",
            Severity.SUCCESS
         )
      );
   } catch (error) {
      // käsitellään virhetilanteet
      if (error.status) {
         next(error);
      } else {
         next(createDatabaseError("Kirjautuminen epäonnistui", error));
      }
   }
};

/**
 * Kirjaa käyttäjän ulos ja poistaa Kubios-tokenin tietokannasta.
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää JWT-tokenin autentikaatioheaderissa
 * @param {Object} req.user - autentikoidun käyttäjän tiedot, jotka on purettu JWT-tokenista
 * @param {number} req.user.kayttaja_id - autentikoidun käyttäjän yksilöllinen tunniste tietokannassa
 * @param {Response} res - HTTP-vastausobjekti JSON-muodossa vastauksen palauttamiseen
 * @param {Function} next - Seuraava middleware-funktio virhetilanteen käsittelyä varten
 * @returns {object} JSON-muotoinen vastaus, joka kertoo Kubios-tokenin poistamisen onnistumisesta
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
   try {
      // tarkistetaan että käyttäjän ID on olemassa autentikaatiotiedoissa
      // käytetään optional chaining -operaattoria (?.) mahdollisten null-arvojen varalta
      const userId = req.user?.kayttaja_id;

      // jos käyttäjän ID puuttuu, palautetaan validointivirhe
      if (!userId) {
         return next(createValidationError("Käyttäjän ID puuttuu"));
      }

      // lokitetaan uloskirjautuminen ja Kubios-tokenin poistotoimenpide
      logger.info(`Logging out user ID: ${userId}, removing Kubios token`);

      // poistetaan käyttäjän Kubios-token tietokannasta
      // removeKubiosToken palauttaa tiedon operaation onnistumisesta (true/false)
      const result = await removeKubiosToken(userId);

      // palautetaan onnistunut vastaus riippumatta siitä, oliko tokenia poistettavaksi
      res.json(
         createResponse(
            {
               tokenRemoved: result, // sisältää tiedon, onnistuiko tokenin poisto
            },
            "Uloskirjautuminen onnistui",
            Severity.SUCCESS
         )
      );
   } catch (error) {
      // virhetilanteessa lokitetaan virhe
      logger.error("Logout error", error);
      next(createDatabaseError("Uloskirjautuminen epäonnistui", error));
   }
};

/**
 * hakee kirjautuneen käyttäjän profiilin tiedot tokenin perusteella.
 * @param {Request} req - HTTP-pyyntöobjekti, joka sisältää autentikaatiotiedot
 * @param {Object} req.user - autentikoidun käyttäjän tiedot, jotka on purettu JWT-tokenista
 * @param {number} req.user.kayttaja_id - autentikoidun käyttäjän yksilöllinen tunniste tietokannassa
 * @param {Response} res - HTTP-vastausobjekti JSON-muodossa käyttäjätietojen palauttamiseen
 * @param {Function} next - Seuraava middleware-funktio virhetilanteen käsittelyä varten
 * @returns {object} JSON-muotoinen profiilidata sisältäen käyttäjän tiedot ilman salasanaa
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
   try {
      // haetaan käyttäjän profiilitiedot tietokannasta käyttäen autentikoidun käyttäjän ID:tä
      const user = await getMyProfile(req.user.kayttaja_id);

      // tarkistetaan löytyikö käyttäjä tietokannasta
      if (!user) {
         return next(createNotFoundError("Käyttäjää ei löytynyt"));
      }

      // palautetaan käyttäjän tiedot onnistuneessa vastauksessa
      res.json(createResponse(user, "Käyttäjätiedot haettu", Severity.SUCCESS));
   } catch (error) {
      // virhetilanteessa siirretään virhe keskitetylle käsittelijälle
      next(createDatabaseError("Käyttäjätietojen hakeminen epäonnistui", error));
   }
};

/**
 * tarkistaa onko token vielä voimassa ja palauttaa käyttäjän tiedot.
 * @param {Request} req - HTTP-pyyntöobjekti, token mukana autentikaatioheaderissa
 * @param {Object} req.user - autentikoidun käyttäjän tiedot tokenista purettuna
 * @param {number} req.user.kayttaja_id - käyttäjän yksilöllinen tunniste tietokannassa
 * @param {Response} res - HTTP-vastausobjekti JSON-muodossa asiakkaalle palauttamista varten
 * @param {Function} next - Seuraava middleware-funktio virheenkäsittelyyn siirtymistä varten
 * @returns {object} JSON-muotoinen vastaus tokenin validoinnista ja käyttäjätiedoista
 * @route GET /api/auth/validate
 */
const validateToken = async (req, res, next) => {
   try {
      // haetaan käyttäjän profiilitiedot tietokannasta token-objektissa olevan ID:n perusteella
      const user = await getMyProfile(req.user.kayttaja_id);

      // tarkistetaan löytyikö käyttäjä tietokannasta
      if (!user) {
         return next(createNotFoundError("Käyttäjää ei löytynyt"));
      }

      // palautetaan onnistunut vastaus ja käyttäjän tiedot
      res.json(
         createResponse(
            {
               valid: true,
               user,
            },
            "Token on voimassa",
            Severity.SUCCESS
         )
      );
   } catch (error) {
      // virhetilanteessa siirretään virhe keskitetylle käsittelijälle
      next(createDatabaseError("Tokenin validointi epäonnistui", error));
   }
};

export { login, logout, getMe, validateToken };
