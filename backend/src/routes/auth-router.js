import express from "express";
import { body } from "express-validator";
import { login, getMe, validateToken, logout } from "../controllers/auth-controller.js";
import { register } from "../controllers/user-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";
import { postLogin, getKubiosMe } from "../controllers/kubios-auth-controller.js";

const authRouter = express.Router();

// Kirjautuminen: POST /api/auth/login
authRouter.post(
  "/login",
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
  login
);

// Uloskirjautuminen: POST /api/auth/logout
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
