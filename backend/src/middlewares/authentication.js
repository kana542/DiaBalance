/**
 * authentication.js - JWT-tokenin tarkistusmiddleware
 * 
 * Varmistaa, että pyyntö sisältää voimassa olevan JWT-tokenin.
 * Lisää `req.user`-kenttään tokenista puretun käyttäjätiedon,
 * jota käytetään mm. käyttöoikeuksien ja käyttäjäkohtaisen datan tarkistamiseen.
 *
 * Käyttö:
 * - käytetään suojaamaan reittejä kuten GET /me, POST /entries jne.
 * - reitti ei jatku jos token puuttuu tai on virheellinen
 */


import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { createAuthenticationError } from './error-handler.js';


/**
 * Tarkistaa Authorization-headerista löytyvän JWT-tokenin.
 * Jos token puuttuu tai on virheellinen, palautetaan 403-virhe.
 * Jos token on validi, asetetaan req.user-tokenin datalla ja siirrytään seuraavaan.
 */
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
