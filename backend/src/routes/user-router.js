/**
 * user-router.js - käyttäjätietojen hallinnan API-reitit
 * -------------
 * Määrittelee käyttäjätietojen hallintaan liittyvät reitit Express-sovellukselle.
 * Käsittelee rekisteröinnin ja käyttäjätietojen päivityksen.
 *
 * pääominaisuudet:
 *    1. käyttäjätilien rekisteröinnin ja päivityksen reittien määrittely
 *    2. reittien suojaus autentikaatiolla ja validaatiolla
 *    3. syötettyjen tietojen validointi ennen controller-funktioiden kutsumista
 *    4. selkeästi nimetyt, käyttäjäkeskeiset resurssireitit
 *
 * keskeiset reitit:
 *    - POST /api/users/register - rekisteröi uusi käyttäjä
 *    - PUT /api/users/me - päivitä kirjautuneen käyttäjän tiedot
 *
 * käyttö sovelluksessa:
 *    - liitetään index.js:ssä Express-sovellukseen (/api/users -etuliitteellä)
 *    - mahdollistaa käyttäjätilien hallinnan erillään autentikaatiotoiminnoista
 *    - varmistaa turvallisen ja validoidun käyttäjätietojen päivityksen
 */

import express from "express";
import { register, updateMe } from "../controllers/user-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";
import {
   registerValidation,
   profileUpdateValidation,
} from "../validation/auth-validation.js";
import logger from "../utils/logger.js";

// luodaan Express-reititin käyttäjien hallintaan
const userRouter = express.Router();

// uuden käyttäjän rekisteröinti: POST /api/users/register
userRouter.post(
   "/register",
   registerValidation,
   validationErrorHandler,
   register
);

// käyttäjän omien tietojen päivitys: PUT /api/users/me
userRouter.put(
   "/me",
   authenticateToken,
   profileUpdateValidation,
   validationErrorHandler,
   updateMe
);

export default userRouter;
