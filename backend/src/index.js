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

const app = express();
const port = process.env.PORT || 3000;
const hostname = "localhost";

// middleware-konfiguraatio
app.use(cors()); // sallii cross-origin pyynnöt frontend-sovelluksesta
app.use(express.json()); // parsii JSON-pyynnöt

// testipolku palvelimen toiminnan tarkistamiseen
app.use("/", (req, res) => {
   res.send("Diabalance BE (dev)");
});

// API-reittien rekisteröinti
app.use("/api/auth", authRouter); // autentikaatioon liittyvät reitit
app.use("/api/entries", entryRouter); // diabetesmerkintöjen hallinta
app.use("/api/kubios", kubiosRouter); // kubios HRV-tietojen käsittely

// keskitetty virheenkäsittely
app.use(notFoundHandler); // käsittelee 404-virheet (resursseja ei löydy)
app.use(errorHandler); // käsittelee kaikki muut virheet yhtenäisellä tavalla

// palvelimen käynnistys
app.listen(port, hostname, () => {
   console.log(`Server running at http://${hostname}:${port}`);
});
