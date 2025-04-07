import express from "express";
import { body } from "express-validator";

import {
  register,
  login,
  validateToken,
  getMe,
  updateMe,
} from "../controllers/user-controller.js";

import { postLogin, getKubiosMe } from "../controllers/kubios-auth-controller.js";

import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";

const userRouter = express.Router();

// Rekisteröityminen, joilla ei ole Kubios-tiliä
userRouter
  .route("/register")
  .post(
    body("kayttajanimi")
      .trim()
      .escape()
      .isLength({ min: 3, max: 40 })
      .withMessage("Käyttäjänimen tulee olla 3–40 merkkiä pitkä"),
    body("salasana")
      .trim()
      .escape()
      .isLength({ min: 8 })
      .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä"),
    validationErrorHandler,
    register
  );

// Kirjautuminen, joilla ei ole Kubios-tiliä
userRouter
  .route("/login")
  .post(
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


// Kubios-kirjautuminen
userRouter
  .route('/kubios-login')
  .post(postLogin);

// Kubios käyttäjän tiedot
userRouter
  .route('/kubios-me')
  .get(authenticateToken, getKubiosMe);  

// Tokenin tarkistus
userRouter.route("/validate").get(authenticateToken, validateToken);

// Omien tietojen haku ja päivitys
userRouter
  .route("/me")
  .get(authenticateToken, getMe)
  .put(
    authenticateToken,
    body("kayttajanimi")
      .optional()
      .trim()
      .escape()
      .isLength({ min: 3, max: 40 })
      .withMessage("Käyttäjänimen tulee olla 3–40 merkkiä pitkä"),
    body("salasana")
      .optional()
      .trim()
      .escape()
      .isLength({ min: 8 })
      .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä"),
    validationErrorHandler,
    updateMe
  );

export default userRouter;
