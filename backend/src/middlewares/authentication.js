import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { createAuthenticationError } from './error-handler.js';

const authenticateToken = (req, res, next) => {
  console.log('authenticateToken', req.headers);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('token', token);

  if (token == undefined) {
    return next(createAuthenticationError("Autentikaatiotoken puuttuu"));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    error.status = 403;
    next(createAuthenticationError("Virheellinen tai vanhentunut token"));
  }
};

export { authenticateToken };
