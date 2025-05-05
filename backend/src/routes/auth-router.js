/**
 * auth-router.js - autentikaatioon liittyvät API-reitit
 * -------------
 * Määrittelee kaikki autentikaatioon liittyvät reititykset Express-sovellukselle.
 * Yhdistää HTTP-pyynnöt vastaaviin controller-funktioihin.
 *
 * pääominaisuudet:
 *    1. kirjautumisen, rekisteröitymisen ja uloskirjautumisen reittien määrittely
 *    2. Kubios-autentikaation reittien integrointi
 *    3. tokenin validoinnin ja käyttäjätietojen hakureittien määrittely
 *    4. reittien suojaus middleware-funktioilla ja validaatioilla
 *
 * keskeiset reitit:
 *    - POST /api/auth/login - käyttäjän kirjautuminen
 *    - POST /api/auth/logout - käyttäjän uloskirjautuminen
 *    - POST /api/auth/register - uuden käyttäjän rekisteröinti
 *    - GET /api/auth/me - kirjautuneen käyttäjän tiedot
 *    - GET /api/auth/validate - tokenin voimassaolon tarkistus
 *
 * käyttö sovelluksessa:
 *    - liitetään index.js:ssä Express-sovellukseen (/api/auth -etuliitteellä)
 *    - käsittelee käyttäjien tunnistautumiseen liittyvät pyynnöt
 *    - ohjaa suojattujen reittien liikenteen autentikaatiotarkistuksen läpi
 */

import express from "express";
import {
   login,
   getMe,
   validateToken,
   logout,
} from "../controllers/auth-controller.js";
import { register } from "../controllers/user-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";
import {
   postLogin,
   getKubiosMe,
} from "../controllers/kubios-auth-controller.js";
import {
   loginValidation,
   registerValidation,
} from "../validation/auth-validation.js";
import logger from "../utils/logger.js";

const authRouter = express.Router();

/**
 * @api {post} /api/auth/login Kirjaudu sisään
 * @apiName Login
 * @apiGroup Autentikointi
 *
 * @apiBody {String} kayttajanimi Käyttäjänimi (pakollinen)
 * @apiBody {String} salasana Salasana (pakollinen)
 *
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Vastausviesti
 * @apiSuccess {Object} data Käyttäjätiedot ja JWT-token
 *
 * @apiSuccessExample {json} Onnistunut vastaus:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Kirjautuminen onnistui",
 *   "data": {
 *     "token": "jwt.token.here",
 *     "user": {
 *       "kayttaja_id": 1,
 *       "kayttajanimi": "testi",
 *       "email": "sahkoposti@sahkoposti.fi"
 *     }
 *   }
 * }
 *
 * @apiErrorExample {json} Virheellinen kirjautuminen:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "success": false,
 *   "message": "Virheellinen käyttäjänimi tai salasana"
 * }
 */
authRouter.post("/login", loginValidation, validationErrorHandler, login);

/**
 * @api {post} /api/auth/logout Kirjaudu ulos
 * @apiName Logout
 * @apiGroup Autentikointi
 * @apiPermission Kirjautunut
 *
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Uloskirjautumisviesti
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Uloskirjautuminen onnistui"
 * }
 */
authRouter.post("/logout", authenticateToken, logout);

// kubios login: POST /api/auth/kubios-login
authRouter.post(
   "/kubios-login",
   loginValidation,
   validationErrorHandler,
   postLogin
);

/**
 * @api {get} /api/auth/kubios-me Hae Kubios-käyttäjän tiedot
 * @apiName GetKubiosMe
 * @apiGroup Autentikointi
 * @apiPermission Kirjautunut
 *
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiSuccess {Boolean} success Onnistuiko pyyntö
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object} data Käyttäjän Kubios-tiedot
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Käyttäjätiedot haettu",
 *   "data": {
 *     "user": {
 *       "kayttaja_id": 1,
 *       "kayttajanimi": "test@example.com",
 *       "email": "test@example.com",
 *       "kayttajarooli": 0
 *     }
 *   },
 * }
 *
 * @apiErrorExample {json} Unauthorized:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "success": false,
 *   "message": "Autentikaatiotoken puuttuu tai on virheellinen"
 * }
 */

authRouter.get("/kubios-me", authenticateToken, getKubiosMe);

/**
 * @api {get} /api/auth/me Hae oma profiili
 * @apiName GetMe
 * @apiGroup Autentikointi
 * @apiPermission Kirjautunut
 *
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiSuccess {Boolean} success Onnistuiko pyyntö
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object} data Käyttäjätiedot
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Käyttäjätiedot haettu",
 *   "data": {
 *     "kayttaja_id": 1,
 *     "kayttajanimi": "test@example.com",
 *     "email": "test@example.com",
 *     "kayttajarooli": 0
 *   }
 * }
 *
 * @apiErrorExample {json} Unauthorized:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "success": false,
 *   "message": "Autentikaatiotoken puuttuu tai on virheellinen"
 * }
 */

authRouter.get("/me", authenticateToken, getMe);

/**
 * @api {get} /api/auth/validate Tarkista tokenin voimassaolo
 * @apiName ValidateToken
 * @apiGroup Autentikointi
 * @apiPermission Kirjautunut
 *
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiSuccess {Boolean} success Onnistuiko pyyntö
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object} data Tietoja tokenista ja käyttäjästä
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Token on voimassa",
 *   "data": {
 *     "valid": true,
 *     "user": {
 *       "kayttaja_id": 1,
 *       "kayttajanimi": "test@example.com",
 *       "email": "test@example.com",
 *       "kayttajarooli": 0
 *     }
 *   }
 * }
 *
 * @apiErrorExample {json} Unauthorized:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "success": false,
 *   "message": "Autentikaatiotoken puuttuu tai on virheellinen"
 * }
 */

authRouter.get("/validate", authenticateToken, validateToken);

/**
 * @api {post} /api/auth/register Rekisteröidy
 * @apiName Register
 * @apiGroup Autentikointi
 *
 * @apiBody {String{3..40}} kayttajanimi Käyttäjänimi
 * @apiBody {String} [email] Sähköposti (valinnainen)
 * @apiBody {String{8..}} salasana Salasana
 *
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object} data Luodun käyttäjän ID
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "message": "Käyttäjä luotu, id: 5",
 *   "data": {
 *     "id": 5
 *   }
 * }
 *
 * @apiErrorExample {json} Validointivirhe:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "message": "Rekisteröinti epäonnistui",
 *   "errors": [
 *     { "field": "kayttajanimi", "message": "Käyttäjänimi on jo käytössä" }
 *   ]
 * }
 */
authRouter.post(
   "/register",
   registerValidation,
   validationErrorHandler,
   register
);

export default authRouter;
