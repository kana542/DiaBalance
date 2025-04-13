/**
 * user-router.js - käyttäjien hallintareitit
 * --------------
 * määrittelee käyttäjien hallintaan liittyvät API-reitit, erityisesti rekisteröitymisen ja käyttäjätietojen päivittämisen toiminnallisuudet.
 * sisältää validoinnin ja suojauksen näille reiteille.
 *
 * pääominaisuudet:
 *    1. käyttäjärekisteröinnin reitti ja validointisäännöt (/register)
 *    2. käyttäjätietojen päivitysreitti autentikaatiosuojauksella (/me)
 *    3. syötteen validointi express-validator -kirjastolla
 *
 * validointisäännöt:
 *    - käyttäjänimi: 3-40 merkkiä, pakollisuus riippuu endpointista
 *    - email: validi sähköpostiosoite, valinnainen
 *    - salasana: vähintään 8 merkkiä, pakollisuus riippuu endpointista
 *
 * käyttö sovelluksessa:
 *    - tarjoaa käyttäjähallintaan liittyvät reitit sovelluksen käyttöön
 *    - toimii rinnakkain auth-router.js:n kanssa, täydentäen käyttäjänhallintaa
 *    - ohjaa pyynnöt user-controller.js:n käsittelijöihin
 */

import express from "express";
import { body } from "express-validator";
import { register, updateMe } from "../controllers/user-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";

// luodaan Express-reititin käyttäjien hallintaan
const userRouter = express.Router();

// uuden käyttäjän rekisteröinti: POST /api/users/register
userRouter
  .post(
    "/register",
    // validointi käyttäjänimelle - vaaditaan 3-40 merkkiä
    body("kayttajanimi")
      .trim()
      .escape()
      .isLength({ min: 3, max: 40 })
      .withMessage("Käyttäjänimen tulee olla 3–40 merkkiä pitkä"),
    // validointi sähköpostille - valinnainen, mutta jos annetaan, pitää olla validi
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Sähköpostiosoitteen tulee olla kelvollinen"),
    // validointi salasanalle - vaaditaan vähintään 8 merkkiä
    body("salasana")
      .trim()
      .escape()
      .isLength({ min: 8 })
      .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä"),
    // validointivirheiden käsittely ennen kontrollerin kutsumista
    validationErrorHandler,
    // rekisteröinnin käsittelevä kontrolleri
    register
  );

// käyttäjän omien tietojen päivitys: PUT /api/users/me
userRouter.put(
  "/me",
  // vaaditaan token kirjautumisen varmistamiseksi
  authenticateToken,
  // validointi käyttäjänimelle - valinnainen, mutta jos annetaan, 3-40 merkkiä
  body("kayttajanimi")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 3, max: 40 })
    .withMessage("Käyttäjänimen tulee olla 3–40 merkkiä pitkä"),
  // validointi sähköpostille - valinnainen, mutta jos annetaan, pitää olla validi
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Sähköpostiosoitteen tulee olla kelvollinen"),
  // validointi salasanalle - valinnainen, mutta jos annetaan, vähintään 8 merkkiä
  body("salasana")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 8 })
    .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä"),
  // validointivirheiden käsittely ennen kontrollerin kutsumista
  validationErrorHandler,
  // tietojen päivityksen käsittelevä kontrolleri
  updateMe
);

export default userRouter;
