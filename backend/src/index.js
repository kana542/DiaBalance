/**
 * index.js - sovelluksen päämoduuli
 * ----------
 * määrittelee Express-sovelluksen konfiguraation, reitit ja käynnistää palvelimen.
 * toimii sovelluksen keskipisteenä, joka yhdistää kaikki muut moduulit.
 *
 * pääominaisuudet:
 *    1. Express-sovelluksen alustus ja middleware-konfiguraatio
 *    2. reittien määrittely ja API-rajapintojen rekisteröinti
 *    3. virheiden käsittely ja palvelimen käynnistys
 *
 * middleware-kerros:
 *    - cors - mahdollistaa cross-origin-pyynnöt (frontend-yhteensopivuus)
 *    - express.json() - käsittelee JSON-muotoisia pyyntöjen runkoja
 *
 * API-reitit:
 *    - /api/auth - kirjautuminen, rekisteröityminen ja käyttäjähallinta
 *    - /api/entries - diabetesmerkintöjen hallinta (CRUD-operaatiot)
 *    - /api/kubios - kubios HRV-tietojen käsittely
 */

import express from "express";
import authRouter from "./routes/auth-router.js";
import entryRouter from "./routes/entry-router.js";
import kubiosRouter from "./routes/kubios-router.js";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import logger from "./utils/logger.js";

const app = express();
const port = process.env.PORT || 3000;
const hostname = "localhost";

// middleware-konfiguraatio
app.use(cors()); // cross-origin pyynnöt käyttöön
app.use(express.json()); // parsii JSON-pyynnöt

// testipolku palvelimen toiminnan tarkistamiseen
app.get("/", (req, res) => {
   res.send("Diabalance BE (dev)");
});

// API-reittien rekisteröinti
app.use("/api/auth", authRouter); // autentikaatioon liittyvät reitit
app.use("/api/entries", entryRouter); // diabetesmerkintöjen hallinta
app.use("/api/kubios", kubiosRouter); // kubios HRV-tietojen käsittely

app.use("/apidoc", express.static("apidoc"));

// HUOM!!!!!
//Jos käyttäjän omien tietojen muokkaus (PUT /api/users/me) halutaan käyttöön, uniikkiuden validointi on toteutettu myös updateMe funktiossa user-controller.js tiedostossa.
// poista kommenttimerkit alla olevista riveistä:

//import userRouter from './routes/user-router.js';
//app.use('/api/users', userRouter);

// keskitetty virheenkäsittely
app.use(notFoundHandler); // käsittelee 404-virheet (resursseja ei löydy)
app.use(errorHandler); // käsittelee kaikki muut virheet yhtenäisellä tavalla

// palvelimen käynnistys
app.listen(port, hostname, () => {
   console.log(`Server running at http://${hostname}:${port}`);
});
