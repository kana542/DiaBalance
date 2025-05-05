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

import express from "express";
import {
   createEntry,
   getEntriesByMonth,
   updateEntry,
   deleteEntry,
} from "../controllers/entry-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";
import { entryValidation } from "../validation/entry-validation.js";
import logger from "../utils/logger.js";

const entryRouter = express.Router();

/**
 * @api {get} /api/entries Hae kuukauden merkinnät
 * @apiName GetEntriesByMonth
 * @apiGroup Merkinnät
 * @apiPermission Käyttäjä
 *
 * @apiQuery {Number} year Vuosi (esim. 2025)
 * @apiQuery {Number} month Kuukausi (1-12)
 *
 * @apiSuccess {Boolean} success Onnistumisen tila
 * @apiSuccess {Object[]} data Lista merkintöjä
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Haettu 21 merkintää", ",
 *       "data": [
 *         {
 *           "pvm": "2025-04-10",
 *           "vs_aamu": 5.6,
 *           "oireet": "väsymys",
 *           "kommentti": "hyvä olo"
 *
 *         }
 *       ]
 *     }
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Vuosi (year) ja kuukausi (month) parametrit vaaditaan"
 *     }
 */
entryRouter.get("/", authenticateToken, getEntriesByMonth);

/**
 * @api {post} /api/entries Luo uusi merkintä
 * @apiName CreateEntry
 * @apiGroup Merkinnät
 * @apiPermission Käyttäjä
 *
 * @apiBody {String} pvm
 * @apiBody {Number} [vs_aamu] Verensokeri aamulla (1–30)
 * @apiBody {Number} [vs_ilta] Verensokeri illalla (1–30)
 * @apiBody {Number} [vs_aamupala_ennen] Verensokeri aamupalan ennen (1–30)
 * @apiBody {Number} [vs_aamupala_jalkeen] Verensokeri aamupalan jälkeen (1–30)
 * @apiBody {Number} [vs_lounas_ennen] Verensokeri lounaan ennen (1–30)
 * @apiBody {Number} [vs_lounas_jalkeen] Verensokeri lounaan jälkeen (1–30)
 * @apiBody {Number} [vs_valipala_ennen] Verensokeri välipalan ennen (1–30)
 * @apiBody {Number} [vs_valipala_jalkeen] Verensokeri välipalan jälkeen (1–30)
 * @apiBody {Number} [vs_paivallinen_ennen] Verensokeri päivällisen ennen (1–30)
 * @apiBody {Number} [vs_paivallinen_jalkeen] Verensokeri päivällisen jälkeen (1–30)
 * @apiBody {Number} [vs_iltapala_ennen] Verensokeri iltapalan ennen (1–30)
 * @apiBody {Number} [vs_iltapala_jalkeen] Verensokeri iltapalan jälkeen (1–30)
 * @apiBody {String} [oireet] Oireet
 * @apiBody {String} [kommentti] Vapaa kommentti
 *
 * @apiSuccess {Boolean} success Onnistumisen tila
 * @apiSuccess {Object} data Sisältää uuden merkinnän ID:n
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "Kirjaus lisätty onnistuneesti",
 *       "data": {
 *         "id": 0
 *       }
 *     }
 *
 * @apiErrorExample {json} Validation Error:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Syötetyssä datassa on virheitä",
 *       "errors": [
 *         {
 *           "field": "vs_aamu",
 *           "message": "Verensokeriarvon tulee olla välillä 1-30 mmol/l"
 *         }
 *       ]
 *     }
 */
entryRouter.post(
   "/",
   authenticateToken,
   entryValidation,
   validationErrorHandler,
   createEntry
);

/**
 * @api {put} /api/entries Päivitä päiväkirjamerkintä
 * @apiName UpdateEntry
 * @apiGroup Merkinnät
 * @apiPermission Kirjautunut
 *
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiBody {String} pvm Päivämäärä (ISO 8601, pakollinen)
 * @apiBody {Number} [vs_aamu] Verensokeri aamulla
 * @apiBody {Number} [vs_ilta] Verensokeri illalla
 * @apiBody {String} [oireet] Oireet
 * @apiBody {String} [kommentti] Kommentti
 *
 * @apiSuccess {Boolean} success Onnistuiko päivitys
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object} data Päivitetyt tiedot
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Kirjaus päivitetty onnistuneesti",
 *   "data": {
 *     "affectedRows": 1
 *   }
 * }
 *
 * @apiErrorExample {json} Validation Error:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "message": "Syötetyssä datassa on virheitä",
 *   "errors": [
 *     {
 *       "field": "vs_ilta",
         "message": "Verensokeriarvon tulee olla välillä 1-30 mmol/l"
 *     }
 *   ]
 * }
 *
 */
entryRouter.put(
   "/",
   authenticateToken,
   entryValidation,
   validationErrorHandler,
   updateEntry
);

/**
 * @api {delete} /api/entries/:date Poista merkintä
 * @apiName DeleteEntry
 * @apiGroup Merkinnät
 * @apiPermission Käyttäjä
 *
 * @apiParam {String} date Päivämäärä (esim. 2025-04-10)
 *
 * @apiSuccess {Boolean} success Onnistumisen tila
 * @apiSuccess {String} message Viesti onnistuneesta poistosta
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Kirjaus poistettu onnistuneesti",
 *      "data": {
 *        "affectedRows": 1
 *     }
 *
 */
entryRouter.delete("/:date", authenticateToken, deleteEntry);

export default entryRouter;
