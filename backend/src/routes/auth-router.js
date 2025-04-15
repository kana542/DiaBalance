import express from "express";
import { body } from "express-validator";
import { login, getMe, validateToken, logout } from "../controllers/auth-controller.js";
import { register } from "../controllers/user-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";
import { postLogin, getKubiosMe } from "../controllers/kubios-auth-controller.js";

const authRouter = express.Router();

// Kirjautuminen: POST /api/auth/login

/**
 * @api {post} /api/auth/login Kirjaudu sisään
 * @apiName Login
 * @apiGroup Autentikointi
 * 
 * @apiBody {String} kayttajanimi Käyttäjänimi (pakollinen)
 * @apiBody {String} salasana Salasana (pakollinen)
 *
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Vastausviesti
 * @apiSuccess {Object} data Käyttäjätiedot ja JWT-token
 *
 * @apiSuccessExample {json} Onnistunut vastaus:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Kirjautuminen onnistui",
 *   "data": {
 *     "token": "jwt.token.here",
 *     "user": {
 *       "kayttaja_id": 1,
 *       "kayttajanimi": "testi"
 *     }
 *   }
 * }
 *
 * @apiErrorExample {json} Virheellinen kirjautuminen:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "success": false,
 *   "message": "Virheellinen käyttäjänimi tai salasana"
 * }
 */
authRouter.post(
  "/login",
  body("kayttajanimi")
    .trim()
    .escape() //Sanitoi erikoismerkit
    .notEmpty()
    .withMessage("Käyttäjänimi vaaditaan"),
  body("salasana")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Salasana vaaditaan"),
  validationErrorHandler,
  login
);

// Uloskirjautuminen: POST /api/auth/logout

/**
 * @api {post} /api/auth/logout Kirjaudu ulos
 * @apiName Logout
 * @apiGroup Autentikointi
 * @apiPermission Kirjautunut
 *
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Uloskirjautumisviesti
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Uloskirjautuminen onnistui"
 * }
 */
authRouter.post(
  "/logout",
  authenticateToken,
  logout
);

// Kubios login: POST /api/auth/kubios-login
authRouter.post(
  "/kubios-login",
  body("kayttajanimi")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Käyttäjänimi vaaditaan"),
  body("salasana")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Salasana vaaditaan"),
  validationErrorHandler,
  postLogin
);

// Kubios käyttäjätiedot: GET /api/auth/kubios-me
authRouter.get("/kubios-me", authenticateToken, getKubiosMe);

// Hae kirjautuneen käyttäjän tiedot: GET /api/auth/me
authRouter.get("/me", authenticateToken, getMe);

// Tarkista tokenin voimassaolo: GET /api/auth/validate
authRouter.get("/validate", authenticateToken, validateToken);

// Rekisteröityminen: POST /api/auth/register
/**
 * @api {post} /api/auth/register Rekisteröidy
 * @apiName Register
 * @apiGroup Autentikointi
 * 
 * @apiBody {String{3..40}} kayttajanimi Käyttäjänimi
 * @apiBody {String} [email] Sähköposti (valinnainen)
 * @apiBody {String{8..}} salasana Salasana
 * 
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object} data Luodun käyttäjän ID
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "message": "Käyttäjä luotu",
 *   "data": {
 *     "id": 5
 *   }
 * }
 *
 * @apiErrorExample {json} Validointivirhe:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "message": "Rekisteröinti epäonnistui",
 *   "errors": [
 *     { "field": "kayttajanimi", "message": "Käyttäjänimi on jo käytössä" }
 *   ]
 * }
 */
authRouter.post(
  "/register",
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
    .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä"),
  validationErrorHandler,
  register
);

export default authRouter;
