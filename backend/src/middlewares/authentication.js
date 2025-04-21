/**
 * authentication.js - JWT-tokenin tarkistusmiddleware
 * -----------------
 * Varmistaa, että API-pyynnöt sisältävät voimassa olevan JWT-tokenin.
 * Toimii suojaavana kerroksena, joka estää pääsyn suojattuihin reitteihin ilman autentikointia.
 *
 * pääominaisuudet:
 *    1. JWT-tokenin dekoodaus ja validointi pyyntöjen yhteydessä
 *    2. käyttäjätietojen asettaminen request-objektiin jatkokäsittelyä varten
 *    3. autentikaatiovirheistä ilmoittaminen standardoidussa muodossa
 *    4. yksinkertainen ja helposti sovellettava autentikaatiokerros
 *
 * keskeiset toiminnot:
 *    - authenticateToken() - tarkistaa Authorization-otsikon ja validoi JWT-tokenin
 *
 * käyttö sovelluksessa:
 *    - liitetään routereihin middleware-funktiona suojaamaan API-reittejä
 *    - mahdollistaa käyttäjäkohtaisen datan käsittelyn kontrollereissa
 *    - varmistaa, että vain kirjautuneet käyttäjät pääsevät käsiksi suojattuihin toimintoihin
 */

import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { createAuthenticationError } from './error-handler.js';
import logger from "../utils/logger.js"


/**
 * Tarkistaa Authorization-headerista löytyvän JWT-tokenin.
 * Jos token puuttuu tai on virheellinen, palautetaan 403-virhe.
 * Jos token on validi, asetetaan req.user-tokenin datalla ja siirrytään seuraavaan.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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
