import express from 'express';
import {body} from 'express-validator';
import {createEntry, patchEntry, deleteEntryByDate} from '../controllers/entry-controller.js';

import {authenticateToken} from '../middlewares/authentication.js';
import {validationErrorHandler} from '../middlewares/error-handler.js';

const entryRouter = express.Router();

entryRouter
  .route('/')
  .post(
    authenticateToken,
    body('pvm').isISO8601(),
    body('hrv_data').isString().optional(),
    body('vs_aamu').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_ilta').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_aamupala_ennen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_aamupala_jalkeen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_lounas_ennen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_lounas_jalkeen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_valipala_ennen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_valipala_jalkeen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_paivallinen_ennen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_paivallinen_jalkeen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_ilapala_ennen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('vs_ilapala_jalkeen').isNumeric().isFloat({min: 0, max: 30}).optional().trim().escape(),
    body('oireet').optional().isString().isLength({ max: 200 }),
    body('kommentti').optional().isString().isLength({ max: 500 }),
    validationErrorHandler,
    createEntry
  );

entryRouter
.route('/:pvm')
.patch(
  authenticateToken,
  patchEntry
)
.delete(
  authenticateToken,
  deleteEntryByDate
);
  

export default entryRouter;
