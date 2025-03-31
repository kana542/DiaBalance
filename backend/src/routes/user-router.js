import express from 'express';
import { body } from 'express-validator';

import {
  register,
  login
} from '../controllers/user-controller.js';

import { authenticateToken } from '../middlewares/authentication.js';
import { validationErrorHandler } from '../middlewares/error-handler.js';

const userRouter = express.Router();

// Rekisteröityminen
userRouter
  .route('/register')
  .post(
    body('kayttajanimi')
      .trim()
      .escape()
      .isLength({ min: 3, max: 40 })
      .withMessage('Käyttäjänimen tulee olla 3–40 merkkiä pitkä'),
    body('salasana')
      .trim()
      .escape()
      .isLength({ min: 8 })
      .withMessage('Salasanan tulee olla vähintään 8 merkkiä pitkä'),
    validationErrorHandler,
    register
  );

// Kirjautuminen
userRouter
  .route('/login')
  .post(
    body('kayttajanimi')
      .trim()
      .escape()
      .notEmpty()
      .withMessage('Käyttäjänimi vaaditaan'),
    body('salasana')
      .trim()
      .escape()
      .notEmpty()
      .withMessage('Salasana vaaditaan'),
    validationErrorHandler,
    login
  );


  export default userRouter;