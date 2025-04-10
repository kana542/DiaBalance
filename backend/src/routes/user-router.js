import express from "express";
import { body } from "express-validator";
import { register, updateMe } from "../controllers/user-controller.js";
import { authenticateToken } from "../middlewares/authentication.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";

const userRouter = express.Router();

userRouter
  .post(
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

userRouter.put(
  "/me",
  authenticateToken,
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
    .withMessage("Salasanan tulee olla vähintään 8 merkkiä pitkä"),
  validationErrorHandler,
  updateMe
);

export default userRouter;
