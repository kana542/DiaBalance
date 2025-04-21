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
import { login, getMe, validateToken, logout } from "../controllers/auth-controller.js";
import { register } from "../controllers/user-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";
import { postLogin, getKubiosMe } from "../controllers/kubios-auth-controller.js";
import { loginValidation, registerValidation } from '../validation/auth-validation.js';
import logger from "../utils/logger.js"

const authRouter = express.Router();

// kirjautuminen: POST /api/auth/login
authRouter.post(
  "/login",
  loginValidation,
  validationErrorHandler,
  login
);

// uloskirjautuminen: POST /api/auth/logout
authRouter.post(
  "/logout",
  authenticateToken,
  logout
);

// kubios login: POST /api/auth/kubios-login
authRouter.post(
  "/kubios-login",
  loginValidation,
  validationErrorHandler,
  postLogin
);

// kubios käyttäjätiedot: GET /api/auth/kubios-me
authRouter.get("/kubios-me", authenticateToken, getKubiosMe);

// hae kirjautuneen käyttäjän tiedot: GET /api/auth/me
authRouter.get("/me", authenticateToken, getMe);

// tarkista tokenin voimassaolo: GET /api/auth/validate
authRouter.get("/validate", authenticateToken, validateToken);

// rekisteröityminen: POST /api/auth/register
authRouter.post(
  "/register",
  registerValidation,
  validationErrorHandler,
  register
);

export default authRouter;
