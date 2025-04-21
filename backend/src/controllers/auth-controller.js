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
   let kubiosStatus = {
      success: false,
      message: "Kubios-kirjautumista ei yritetty",
   };

   try {
      if (user.email) {
         logger.info(`Attempting Kubios login for user ID: ${user.kayttaja_id}`);
         const { idToken, expiresIn } = await kubiosLogin(user.email, salasana);

         // tallenna token tietokantaan
         await updateKubiosToken(user.kayttaja_id, idToken, expiresIn);

         kubiosStatus = {
            success: true,
            message: "Kubios-kirjautuminen onnistui",
         };

         logger.info(`Kubios login successful for user ID: ${user.kayttaja_id}`);
      } else {
         logger.info(`Cannot attempt Kubios login - no email for user: ${user.kayttajanimi}`);
         kubiosStatus = {
            success: false,
            message:
               "Käyttäjällä ei ole sähköpostiosoitetta Kubios-kirjautumista varten",
         };
      }
   } catch (kubiosError) {
      logger.error("Kubios login error", kubiosError);
      kubiosStatus = {
         success: false,
         message: kubiosError.message || "Kubios-kirjautuminen epäonnistui",
      };
   }

   return kubiosStatus;
};

/**
 * Kirjautuu sisään käyttäjänimellä ja salasanalla.
 * Jos onnistuu, palauttaa JWT-tokenin ja käyttäjätiedot (ilman salasanaa).
 * Lisäksi yrittää kirjautua myös Kubios-palveluun, jos käyttäjällä on sähköposti.
 * @param {Request} req - HTTP-pyyntö, bodyssä käyttäjätunnus ja salasana
 * @param {Response} res - HTTP-vastaus JSON-muodossa (token, user, kubios)
 * @param {Function} next - Seuraava middleware virheenkäsittelyyn
 * @returns {object} JSON-vastaus jossa token ja käyttäjätiedot
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
   try {
      const { kayttajanimi, salasana } = req.body;

      // Autentikoi käyttäjä
      const user = await authenticateUser(kayttajanimi, salasana);

      // Luo token
      const token = generateToken(user);

      // Poista salasana vastauksesta
      delete user.salasana;

      // Yritä Kubios-kirjautumista
      const kubiosStatus = await handleKubiosLogin(user, salasana);

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
      if (error.status) {
         next(error);
      } else {
         next(createDatabaseError("Kirjautuminen epäonnistui", error));
      }
   }
};

/**
 * Kirjaa käyttäjän ulos ja poistaa Kubios-tokenin tietokannasta.
 * @param {Request} req - HTTP-pyyntö, token mukana
 * @param {Response} res - HTTP-vastaus JSON-muodossa (tokenRemoved)
 * @param {Function} next - Seuraava middleware virheenkäsittelyyn
 * @returns {object} JSON-vastaus jossa poistamisen tila
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
   try {
      // Tarkista että kayttaja_id on olemassa
      const userId = req.user?.kayttaja_id;

      if (!userId) {
         return next(createValidationError("Käyttäjän ID puuttuu"));
      }

      logger.info(`Logging out user ID: ${userId}, removing Kubios token`);

      // Poista Kubios token ja logita toimenpide
      const result = await removeKubiosToken(userId);

      res.json(
         createResponse(
            {
               tokenRemoved: result,
            },
            "Uloskirjautuminen onnistui",
            Severity.SUCCESS
         )
      );
   } catch (error) {
      logger.error("Logout error", error);
      next(createDatabaseError("Uloskirjautuminen epäonnistui", error));
   }
};

/**
 * Hakee kirjautuneen käyttäjän profiilin (tokenin perusteella).
 * @param {Request} req - HTTP-pyyntö, token mukana
 * @param {Response} res - HTTP-vastaus JSON-muodossa (user-tiedot)
 * @param {Function} next - Seuraava middleware virheenkäsittelyyn
 * @returns {object} JSON-profiilidata
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
   try {
      const user = await getMyProfile(req.user.kayttaja_id);

      if (!user) {
         return next(createNotFoundError("Käyttäjää ei löytynyt"));
      }

      res.json(createResponse(user, "Käyttäjätiedot haettu", Severity.SUCCESS));
   } catch (error) {
      next(
         createDatabaseError("Käyttäjätietojen hakeminen epäonnistui", error)
      );
   }
};

/**
 * Tarkistaa onko token vielä voimassa ja palauttaa käyttäjän tiedot.
 * @param {Request} req - HTTP-pyyntö, token mukana
 * @param {Response} res - HTTP-vastaus JSON-muodossa
 * @param {Function} next - Seuraava middleware virheenkäsittelyyn
 * @returns {object} JSON-tarkistusvastaus
 * @route GET /api/auth/validate
 */
const validateToken = async (req, res, next) => {
   try {
      const user = await getMyProfile(req.user.kayttaja_id);

      if (!user) {
         return next(createNotFoundError("Käyttäjää ei löytynyt"));
      }

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
      next(createDatabaseError("Tokenin validointi epäonnistui", error));
   }
};

export { login, logout, getMe, validateToken };
