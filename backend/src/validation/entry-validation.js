/**
 * entry-validation.js - Merkintöjen validointisäännöt
 * ------------------
 * Sisältää merkintöihin ja HRV-dataan liittyvät validointisäännöt express-validator -kirjastoa käyttäen.
 * Varmistaa, että tallennetut tiedot ovat oikeassa muodossa ja arvoalueella.
 *
 * pääominaisuudet:
 *    1. verensokerimerkintöjen validointisäännöt (arvoalueet, pakollisia kenttiä)
 *    2. HRV-datan validointisäännöt (arvot fysiologisesti mahdollisissa rajoissa)
 *    3. päivämäärien validointi ISO8601-muodossa
 *    4. syötetyn datan sanitointi ja tarkistus
 *
 * keskeiset validointisäännöt:
 *    - entryValidation - tarkistaa verensokerimerkinnän kenttien kelvollisuuden
 *    - bloodSugarValidation - validoi verensokeriarvon olevan sallitulla alueella
 *    - hrvDataValidation - varmistaa HRV-tietojen olevan järkevällä arvoalueella
 *
 * käyttö sovelluksessa:
 *    - liitetään middleware-funktioina reitteihin entry-router.js ja kubios-router.js -tiedostoissa
 *    - estää virheellisen datan tallentumisen tietokantaan
 *    - parantaa sovelluksen luotettavuutta ja tietoturvaa
 */

import { body } from "express-validator";
import logger from "../utils/logger.js"

// verensokeriarvon validointisääntö
const bloodSugarValidation = (field) =>
  body(field)
    .optional({ nullable: true })
    .isFloat({min: 1, max: 30})
    .withMessage('Verensokeriarvon tulee olla välillä 1-30 mmol/l');

// merkinnän validointisäännöt
export const entryValidation = [
  body('pvm').isISO8601().withMessage('Päivämäärän tulee olla ISO8601-muodossa (YYYY-MM-DD)'),

  // verensokeriarvot
  bloodSugarValidation('vs_aamu'),
  bloodSugarValidation('vs_ilta'),
  bloodSugarValidation('vs_aamupala_ennen'),
  bloodSugarValidation('vs_aamupala_jalkeen'),
  bloodSugarValidation('vs_lounas_ennen'),
  bloodSugarValidation('vs_lounas_jalkeen'),
  bloodSugarValidation('vs_valipala_ennen'),
  bloodSugarValidation('vs_valipala_jalkeen'),
  bloodSugarValidation('vs_paivallinen_ennen'),
  bloodSugarValidation('vs_paivallinen_jalkeen'),
  bloodSugarValidation('vs_iltapala_ennen'),
  bloodSugarValidation('vs_iltapala_jalkeen'),

  // tekstikentät
  body('oireet').optional().isString().trim().escape(),
  body('kommentti').optional().isString().trim().escape()
];


// HRV-datan validointisäännöt
export const hrvDataValidation = [
  body('readiness')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('Valmiusasteen tulee olla välillä 0-100'),

  body('stress_index')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Stressiarvon tulee olla positiivinen luku'),

  body('mean_hr_bpm')
    .optional({ nullable: true })
    .isInt({ min: 30, max: 220 })
    .withMessage('Sykkeen tulee olla välillä 30-220 bpm'),

  body('sdnn_ms')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('SDNN-arvon tulee olla positiivinen luku')
];
