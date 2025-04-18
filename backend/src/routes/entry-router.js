import express from 'express';
import {body} from 'express-validator';
import {createEntry, getEntriesByMonth, updateEntry, deleteEntry} from '../controllers/entry-controller.js';

import {authenticateToken} from '../middlewares/authentication.js';
import {validationErrorHandler} from '../middlewares/error-handler.js';

const entryRouter = express.Router();

// Hae kuukauden merkinnät: GET /api/entries?year=2025&month=4
entryRouter.get(
  '/',
  authenticateToken,
  getEntriesByMonth
);

// Luo uusi merkintä: POST /api/entries
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
entryRouter.delete(
  '/:date',
  authenticateToken,
  deleteEntry
);

export default entryRouter;
