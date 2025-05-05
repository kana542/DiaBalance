/**
 * kubios-router.js - Kubios HRV-datan API-reitit
 * -------------
 * Määrittelee kaikki Kubios-palveluun ja HRV-dataan liittyvät reitit Express-sovellukselle.
 * Mahdollistaa HRV-datan haun ja tallennuksen autentikoiduille käyttäjille.
 *
 * pääominaisuudet:
 *    1. HRV-datan hakureitit Kubios API:sta
 *    2. käyttäjäkohtaisen HRV-datan hallinnan reitit
 *    3. reittien suojaus autentikaatiolla ja validoinnilla
 *    4. päivämääräkohtaisten HRV-tietojen käsittely
 *
 * keskeiset reitit:
 *    - GET /api/kubios/user-data - hae kaikki käyttäjän HRV-tiedot
 *    - GET /api/kubios/user-info - hae käyttäjän perustiedot Kubios-palvelusta
 *    - GET /api/kubios/user-data/:date - hae tietyn päivän HRV-tiedot
 *    - POST /api/kubios/user-data/:date - tallenna HRV-data tietylle päivälle
 *
 * käyttö sovelluksessa:
 *    - liitetään index.js:ssä Express-sovellukseen (/api/kubios -etuliitteellä)
 *    - integroituu Kubios Cloud API:n kanssa HRV-datan hakemiseksi
 *    - täydentää verensokerimerkintöjä HRV-datalla kokonaisvaltaisen terveysnäkymän tarjoamiseksi
 */

import express from "express";
import { authenticateToken } from "../middlewares/authentication.js";
import {
   getUserData,
   getUserInfo,
   getUserDataByDate,
   saveHrvData,
} from "../controllers/kubios-controller.js";
import { validationErrorHandler } from "../middlewares/error-handler.js";
import { hrvDataValidation } from "../validation/entry-validation.js";
import logger from "../utils/logger.js";

// luodaan Express-reititin Kubios HRV -toiminnoille
const kubiosRouter = express.Router();

// hae kaikki käyttäjän Kubios HRV -tiedot: GET /api/kubios/user-data
/**
 * @api {get} /api/kubios/user-data Hae kaikki HRV-tiedot
 * @apiName GetUserData
 * @apiGroup Kubios
 * @apiPermission Kirjautunut
 *
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object[]} data Lista HRV-tiedoista
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "Kubios-tiedot haettu onnistuneesti",
 *   "data": [ ... ]
 * }
 */
kubiosRouter.get("/user-data", authenticateToken, getUserData);

// hae käyttäjän perustiedot Kubios-palvelusta: GET /api/kubios/user-info
/**
  * @api {get} /api/kubios/user-info Hae käyttäjän perustiedot Kubios-palvelusta
  * @apiName GetUserInfo
  * @apiGroup Kubios
  * @apiPermission Kirjautunut
  *
  * @apiHeader {String} Authorization Bearer-token
  *
  * @apiSuccess {Boolean} success Toiminnon tila
  * @apiSuccess {String} message Viesti
  * @apiSuccess {Object} data Käyttäjän perustiedot
  *
  * @apiSuccessExample {json} Success:
  * HTTP/1.1 200 OK
  * {
  *   "success": true,
      "message": "Kubios-käyttäjätiedot haettu",
      "severity": "success",
      "data": {
        "status": "ok",
        "user": {
          "birthdate": "",
          "email": "esimerkki@sahkoposti.fi",
          "family_name": "lastname",
          "gender": "female",
  *     ...
  *   }
  * }
  */
kubiosRouter.get("/user-info", authenticateToken, getUserInfo);

// hae käyttäjän HRV-tiedot tietyltä päivämäärältä: GET /api/kubios/user-data/:date
/**
 * @api {get} /api/kubios/user-data/:date Hae HRV-tiedot tietylle päivälle
 * @apiName GetUserDataByDate
 * @apiGroup Kubios
 * @apiPermission Kirjautunut
 *
 * @apiParam {String} date Päivämäärä
 * @apiHeader {String} Authorization Bearer-token
 *
 * @apiSuccess {Boolean} success Toiminnon tila
 * @apiSuccess {String} message Viesti
 * @apiSuccess {Object[]} data HRV-tulokset kyseiseltä päivältä
 *
 * @apiSuccessExample {json} Success:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "message": "HRV-tiedot haettu onnistuneesti",
 *   "data": [
 *     {
 *       "date": "2025-04-14",
 *       "stress_index": 28,
 *       ...
 *     }
 *   ]
 * }
 */
kubiosRouter.get("/user-data/:date", authenticateToken, getUserDataByDate);

// tallenna käyttäjän HRV-tiedot tietylle päivämäärälle: POST /api/kubios/user-data/:date
kubiosRouter.post(
   "/user-data/:date",
   authenticateToken,
   hrvDataValidation,
   validationErrorHandler,
   saveHrvData
);

export default kubiosRouter;
