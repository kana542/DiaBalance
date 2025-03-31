import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  registerUser,
  loginUser
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

// Kirjautuminen
const login = async (req, res, next) => {
    try {
      const { kayttajanimi, salasana } = req.body;
  
      if (!kayttajanimi || !salasana) {
        return next(customError('Käyttäjänimi ja salasana vaaditaan', 400));
      }
  
      const user = await loginUser(kayttajanimi);
  
      if (!user) {
        return next(customError('Virheellinen käyttäjätunnus', 401));
      }
  
      const match = await bcrypt.compare(salasana, user.salasana);
  
      if (!match) {
        return next(customError('Virheellinen salasana', 401));
      }
  
      const token = jwt.sign(
        {
          kayttaja_id: user.kayttaja_id,
          kayttajarooli: user.kayttajarooli
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
  
      delete user.salasana;
  
      res.json({
        message: 'Kirjautuminen onnistui',
        token,
        user
      });
    } catch (error) {
      next(customError(error.message, 400));
    }
  };

// Tarkista tokenin voimassaolo ja palauta käyttäjätiedot
const validateToken = async (req, res, next) => {
    try {
      //haetaan käyttäjän tiedot tietokannasta sen perusteella mitä JWT-tokenissa on
      const user = await getMyProfile(req.user.kayttaja_id);
      //jos käyttäjää ei löydy, palautetaan virhe
      if (!user) {
        return next(customError('Käyttäjää ei löytynyt', 404));
      }
  
      res.json({
        valid: true,
        user
      });
    } catch (error) {
      next(customError(error.message, 400));
    }
  };
  

export { register, login, validateToken };