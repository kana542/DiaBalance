/**
 * entry-router.js - merkintöjen hallinnan API-reitit
 * -------------
 * Määrittelee kaikki diabetesmerkintöihin liittyvät reitit Express-sovellukselle.
 * Käsittelee merkintöjen luomisen, lukemisen, päivittämisen ja poistamisen (CRUD).
 *
 * pääominaisuudet:
 *    1. merkintöjen CRUD-operaatioiden reittien määrittely
 *    2. reittien suojaaminen autentikaatiolla
 *    3. pyyntöjen validointi ennen controller-funktioiden kutsumista
 *    4. järkevästi nimetyt resursseihin perustuvat URL-reitit
 *
 * keskeiset reitit:
 *    - GET /api/entries?year=YYYY&month=MM - hae kuukauden merkinnät
 *    - POST /api/entries - luo uusi merkintä
 *    - PUT /api/entries - päivitä merkintä
 *    - DELETE /api/entries/:date - poista merkintä
 *
 * käyttö sovelluksessa:
 *    - liitetään index.js:ssä Express-sovellukseen (/api/entries -etuliitteellä)
 *    - mahdollistaa käyttäjäkohtaisten verensokerimerkintöjen hallinnan
 *    - varmistaa, että vain autentikoidut käyttäjät pääsevät käsiksi merkintöihin
 */

import express from 'express';
import {createEntry, getEntriesByMonth, updateEntry, deleteEntry} from '../controllers/entry-controller.js';
import {authenticateToken} from '../middlewares/authentication.js';
import {validationErrorHandler} from '../middlewares/error-handler.js';
import {entryValidation} from '../validation/entry-validation.js';
import logger from "../utils/logger.js"

const entryRouter = express.Router();

// hae kuukauden merkinnät: GET /api/entries?year=2025&month=4
entryRouter.get(
  '/',
  authenticateToken,
  getEntriesByMonth
);

// luo uusi merkintä: POST /api/entries
entryRouter.post(
  '/',
  authenticateToken,
  entryValidation,
  validationErrorHandler,
  createEntry
);

// päivitä merkintä: PUT /api/entries
entryRouter.put(
  '/',
  authenticateToken,
  entryValidation,
  validationErrorHandler,
  updateEntry
);

// poista merkintä: DELETE /api/entries/2025-04-10
entryRouter.delete(
  '/:date',
  authenticateToken,
  deleteEntry
);

export default entryRouter;
