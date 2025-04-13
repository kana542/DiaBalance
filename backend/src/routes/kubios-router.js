/**
 * kubios-router.js - Kubios HRV -tietojen API-reitit
 * -----------------
 * määrittelee reitit Kubios HRV (Heart Rate Variability) -tietojen käsittelyyn.
 * vastaa sovelluksen ja Kubios-palvelun välisestä tiedonvaihdosta sekä
 * HRV-tietojen hakemisesta ja tallentamisesta.
 *
 * pääominaisuudet:
 *    1. käyttäjän Kubios-tietojen haku (user-data, user-info)
 *    2. päiväkohtaisten HRV-tietojen käsittely (haku ja tallennus)
 *    3. autentikaatiosuojaus kaikille reiteille
 *
 * API-reitit:
 *    - GET /user-data - hakee käyttäjän kaikki Kubios HRV-tiedot
 *    - GET /user-info - hakee käyttäjän perustiedot Kubios-palvelusta
 *    - GET /user-data/:date - hakee käyttäjän HRV-tiedot tietyltä päivämäärältä
 *    - POST /user-data/:date - tallentaa käyttäjän HRV-tiedot tietylle päivämäärälle
 *
 * käyttö sovelluksessa:
 *    - integroitu diabetesmerkintöihin HRV-mittausten analysointia varten
 *    - keskeinen osa sovelluksen tarjoamaa stressin ja fysiologisen tilan seurantaa
 *    - toimii rajapintana ulkoisen Kubios-pilvipalvelun kanssa
 */

import express from "express";
import { authenticateToken } from "../middlewares/authentication.js";
import {
   getUserData,
   getUserInfo,
   getUserDataByDate,
   saveHrvData,
} from "../controllers/kubios-controller.js";

// luodaan Express-reititin Kubios HRV -toiminnoille
const kubiosRouter = express.Router();

// hae kaikki käyttäjän Kubios HRV -tiedot: GET /api/kubios/user-data
kubiosRouter.get("/user-data", authenticateToken, getUserData);

// hae käyttäjän perustiedot Kubios-palvelusta: GET /api/kubios/user-info
kubiosRouter.get("/user-info", authenticateToken, getUserInfo);

// hae käyttäjän HRV-tiedot tietyltä päivämäärältä: GET /api/kubios/user-data/:date
kubiosRouter.get("/user-data/:date", authenticateToken, getUserDataByDate);

// tallenna käyttäjän HRV-tiedot tietylle päivämäärälle: POST /api/kubios/user-data/:date
kubiosRouter.post("/user-data/:date", authenticateToken, saveHrvData);

export default kubiosRouter;
