import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  registerUser
} from '../models/user-model.js';
import { customError } from '../middlewares/error-handler.js';

// Rekisteröinti
const register = async (req, res, next) => {
  try {
    const { kayttajanimi, salasana, kayttajarooli } = req.body;

    if (!kayttajanimi || !salasana) {
      return next(customError('Käyttäjänimi ja salasana vaaditaan', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(salasana, salt);

    const newUser = {
      kayttajanimi,
      salasana: hashedPassword,
      kayttajarooli: kayttajarooli || 0
    };

    const userId = await registerUser(newUser);
    res.status(201).json({ message: `Käyttäjä luotu, id: ${userId}` });
  } catch (error) {
    next(customError(error.message, 400));
  }
};

export { register };