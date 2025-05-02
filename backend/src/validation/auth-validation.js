/**
 * auth-validation.js - Autentikoinnin validointisäännöt
 * ------------------
 * Sisältää autentikointiin liittyvät validointisäännöt express-validator -kirjastoa käyttäen.
 * Varmistaa, että käyttäjätiedot täyttävät vaaditut kriteerit ennen tietokantaoperaatioita.
 *
 * pääominaisuudet:
 *    1. kirjautumisen validointisäännöt (käyttäjänimi, salasana)
 *    2. rekisteröinnin validointisäännöt (käyttäjänimi, salasana, sähköposti)
 *    3. profiilin päivityksen validointisäännöt (vapaaehtoisten kenttien käsittely)
 *    4. syötetyn datan sanitointi tietoturvan parantamiseksi
 *
 * keskeiset validointisäännöt:
 *    - loginValidation - varmistaa kirjautumistietojen kelvollisuuden
 *    - registerValidation - tarkistaa rekisteröintitietojen kelvollisuuden
 *    - profileUpdateValidation - validoi profiilitietojen päivityksen
 *
 * käyttö sovelluksessa:
 *    - liitetään middleware-funktioina reitteihin auth-router.js ja user-router.js -tiedostoissa
 *    - suojaa sovellusta virheellisiltä syötteiltä ja hyökkäyksiltä
 *    - tarjoaa selkeitä virheilmoituksia epäkelvoista syötteistä
 */

import { body } from "express-validator";
import logger from "../utils/logger.js"

// kirjautumisen validointisäännöt
export const loginValidation = [
  body("kayttajanimi")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Käyttäjänimi vaaditaan"),
  body("salasana")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Salasana vaaditaan")
];

// rekisteröitymisen validointisäännöt
export const registerValidation = [
  body("kayttajanimi")
    .trim()
    .escape()
    .isLength({ min: 3, max: 40 })
    .withMessage("Käyttäjänimen tulee olla 3–40 merkkiä pitkä"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Sähköpostiosoitteen tulee olla kelvollinen"),
  body("salasana")
    .trim()
    .escape()
    .isLength({ min: 8 })
    .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä")
];

// profiilin päivityksen validointisäännöt
export const profileUpdateValidation = [
  body("kayttajanimi")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 3, max: 40 })
    .withMessage("Käyttäjänimen tulee olla 3–40 merkkiä pitkä"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Sähköpostiosoitteen tulee olla kelvollinen"),
  body("salasana")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 8 })
    .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä")
];
