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


/**
 * @api {post} /api/users/register Rekisteröidy
 * @apiName Register
 * @apiGroup Käyttäjät
 * @apiDescription Luo uuden käyttäjän tilin.
 *
 * @apiBody {String{3..40}} kayttajanimi Käyttäjänimi (pakollinen)
 * @apiBody {String} [email] Sähköposti
 * @apiBody {String{8..}} salasana Salasana (pakollinen, vähintään 8 merkkiä, sisältäen ison kirjaimen, pienen kirjaimen ja numeron)
 *
 * @apiSuccess {Boolean} success Onnistuiko toiminto
 * @apiSuccess {String} message Onnistumisviesti
 * @apiSuccess {Object} data Sisältää uuden käyttäjän ID:n
 *
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "message": "Käyttäjä luotu, id: 12",
 *   "data": {
 *     "id": 12
 *   }
 * }
 *
 * @apiError {Boolean} success false
 * @apiError {String} message Virheilmoitus
 *
 * @apiErrorExample {json} Error-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "message": "Rekisteröinti epäonnistui",
 *   "errors": [
 *     { "field": "kayttajanimi", "message": "Käyttäjänimi on jo käytössä" },
 *     { "field": "email", "message": "Sähköposti on jo käytössä" }
 *   ]
 * }
 */
userRouter
  .post(
    "/register",
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
    body("salasana")
      .trim()
      .escape()
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä, sisältää vähintään yksi pieni kirjain, yksi iso kirjain ja yksi numero"),
    validationErrorHandler,
    register
  );

// käyttäjän omien tietojen päivitys: PUT /api/users/me
userRouter.put(
  "/me",
  // vaaditaan token kirjautumisen varmistamiseksi
  authenticateToken,
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
  body("salasana")
  .trim()
  .escape()
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
  .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä, sisältää vähintään yksi pieni kirjain, yksi iso kirjain ja yksi numero"),
  validationErrorHandler,
  updateMe
);

export default userRouter;
