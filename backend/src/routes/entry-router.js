import express from 'express';
import {body} from 'express-validator';
import {createEntry, getEntriesByMonth, updateEntry, deleteEntry} from '../controllers/entry-controller.js';

import {authenticateToken} from '../middlewares/authentication.js';
import {validationErrorHandler} from '../middlewares/error-handler.js';

const entryRouter = express.Router();

// Hae kuukauden merkinnät: GET /api/entries?year=2025&month=4

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
 *       "message": "Merkinnät haettu",
 *       "data": [
 *         {
 *           "pvm": "2025-04-10",
 *           "vs_aamu": 5.6,
 *           "oireet": "väsymys",
 *           "kommentti": "hyvä olo"
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

entryRouter.get(
  '/',
  authenticateToken,
  getEntriesByMonth
);

// Luo uusi merkintä: POST /api/entries

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
  '/',
  authenticateToken,
  body('pvm').isISO8601(),
  // Kaikki nämä kentät sallivat null-arvon
  //kaikki verensokeriarvot sallitaan välillä 1-30
  body('vs_aamu').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_ilta').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_aamupala_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_aamupala_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_lounas_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_lounas_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_valipala_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_valipala_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_paivallinen_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_paivallinen_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_iltapala_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_iltapala_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('oireet').optional().isString().trim().escape(),
  body('kommentti').optional().isString().trim().escape(),
  validationErrorHandler,
  createEntry
);

// Päivitä merkintä: PUT /api/entries
entryRouter.put(
  '/',
  authenticateToken,
  body('pvm').isISO8601(),
  // Kaikki nämä kentät sallivat null-arvon
  body('vs_aamu').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_ilta').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_aamupala_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_aamupala_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_lounas_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_lounas_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_valipala_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_valipala_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_paivallinen_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_paivallinen_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_iltapala_ennen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('vs_iltapala_jalkeen').optional({ nullable: true }).isFloat({min: 1, max: 30}).withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l'),
  body('oireet').optional().isString().trim().escape(),
  body('kommentti').optional().isString().trim().escape(),
  validationErrorHandler,
  updateEntry
);

// Poista merkintä: DELETE /api/entries/2025-04-10

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
entryRouter.delete(
  '/:date',
  authenticateToken,
  deleteEntry
);

export default entryRouter;
