/**
 * error-handler.js - "single responsibility"-periaate (hehee oon vitun itfilosofi t. jonne)
 * ----------------
 * backendin keskitetty virheidenkäsittelyn järjestelmä, joka standardoi API-vastaukset.
 * ideana tehdä virheiden ja ilmoitusten käsittelystä johdonmukaista koko sovelluksessa.
 *
 * pääominaisuudet:
 *    1. virhekategoriat (VALIDATION, AUTH, ACCESS, DB, NOT_FOUND, EXTERNAL, GENERAL, INTERNAL)
 *    2. vakavuustasot (info, success, warning, error) - vaikuttavat frontend-ilmoitusten väreihin
 *    3. standardoidut HTTP-vastaukset sekä onnistumisille että virheille
 *
 * käyttö kontrollerissa:
 *    - virheenkäsittely: next(createValidationError("virheviesti"));
 *    - onnistunut vastaus: res.json(createResponse(data, "onnistumisviesti"));
 *
 * virheitä voi luoda apufunktioilla:
 *    - createValidationError()  - Syötteiden validointivirheet (400)
 *    - createAuthenticationError() - Kirjautumisvirheet (401)
 *    - createNotFoundError() - Resurssia ei löydy (404)
 *    - createDatabaseError() - Tietokantavirheet (500)
 *    - createExternalApiError() - Ulkoisten API-kutsujen virheet (502)
*/

import { validationResult } from "express-validator";

// virheiden kategoriat
const ErrorCategory = {
   VALIDATION: "VALIDATION", // validointivirheet
   AUTHENTICATION: "AUTH", // kirjautumiseen ja tokeneihin liittyvät virheet
   AUTHORIZATION: "ACCESS", // käyttöoikeuksiin liittyvät virheet
   DATABASE: "DB", // tietokantavirheet
   NOT_FOUND: "NOT_FOUND", // resurssia ei löydy
   EXTERNAL_API: "EXTERNAL", // kubios API ym. ulkoiset palvelut
   GENERAL: "GENERAL", // yleiset virheet
   INTERNAL: "INTERNAL", // sisäiset palvelinvirheet
};

// vakavuustasot
const Severity = {
   INFO: "info",
   SUCCESS: "success",
   WARNING: "warning",
   ERROR: "error",
};

/**
 * luo standardoidun virheobjektin
 * @param {string} message - käyttäjälle näytettävä viesti
 * @param {number} status - HTTP-statuskoodi
 * @param {string} category - virhekategoria (ErrorCategory)
 * @param {string} severity - virheen vakavuus (Severity)
 * @param {array|object} errors - mahdolliset lisävirhetiedot
 * @returns {Error} virhe-objekti
 */
const customError = (
   message,
   status = 400,
   category = ErrorCategory.GENERAL,
   severity = Severity.ERROR,
   errors = null
) => {
   const error = new Error(message);
   error.status = status;
   error.category = category;
   error.severity = severity;
   error.errorCode = `${category}_${status}`;
   if (errors) error.errors = errors;
   return error;
};

/**
 * luo standardoidun onnistuneen vastauksen
 * @param {*} data - vastauksen data
 * @param {string} message - käyttäjälle näytettävä viesti
 * @param {string} severity - ilmoituksen vakavuus (Severity)
 * @returns {object} vastausobjekti
 */
const createResponse = (
   data = null,
   message = "Toiminto onnistui",
   severity = Severity.SUCCESS
) => {
   return {
      success: true,
      message,
      severity,
      data,
      timestamp: new Date().toISOString(),
   };
};

// 404 not found -virheiden käsittelijä
const notFoundHandler = (req, res, next) => {
   const error = customError(
      `Resurssia ei löytynyt: ${req.originalUrl}`,
      404,
      ErrorCategory.NOT_FOUND
   );
   next(error);
};

// validointivirheiden käsittelijä (express-validator)
const validationErrorHandler = (req, res, next) => {
   const validationErrors = validationResult(req, { strictParams: ["body"] });

   if (!validationErrors.isEmpty()) {
      const formattedErrors = validationErrors
         .array({ onlyFirstError: true })
         .map((error) => {
            return { field: error.path, message: error.msg };
         });

      const error = customError(
         "Syötetyssä datassa on virheitä",
         400,
         ErrorCategory.VALIDATION,
         Severity.WARNING,
         formattedErrors
      );
      return next(error);
   }
   next();
};

// keskitetty virheidenkäsittelijä
const errorHandler = (err, req, res, next) => {
   // konsoli-ilmoitukset kehitystä varten
   if (err.status >= 500) {
      console.error("Server error:", err);
   } else {
      console.log("Client error:", {
         message: err.message,
         status: err.status,
         category: err.category,
         path: req.originalUrl,
      });
   }

   // standardoitu vastaus käyttäjälle
   res.status(err.status || 500).json({
      success: false,
      message: err.message || "Tapahtui virhe",
      status: err.status || 500,
      severity: err.severity || Severity.ERROR,
      category: err.category || ErrorCategory.INTERNAL,
      errorCode: err.errorCode || `${ErrorCategory.INTERNAL}_500`,
      errors: err.errors || null,
      timestamp: new Date().toISOString(),
   });
};

// valmiit apufunktiot yleisimpien virheiden luomiseen
const createValidationError = (message, errors = null) =>
  customError(message, 400, ErrorCategory.VALIDATION, Severity.WARNING, errors);

const createAuthenticationError = (message) =>
  customError(message, 401, ErrorCategory.AUTHENTICATION, Severity.ERROR);

const createAuthorizationError = (message) =>
  customError(message, 403, ErrorCategory.AUTHORIZATION, Severity.ERROR);

const createNotFoundError = (message) =>
  customError(message, 404, ErrorCategory.NOT_FOUND, Severity.WARNING);

const createDatabaseError = (message, originalError = null) => {
  // log alkuperäinen virhe
  if (originalError) console.error('Database error details:', originalError);
  return customError(message, 500, ErrorCategory.DATABASE, Severity.ERROR);
};

const createExternalApiError = (message, originalError = null) => {
  // log alkuperäinen virhe
  if (originalError) console.error('External API error details:', originalError);
  return customError(message, 502, ErrorCategory.EXTERNAL_API, Severity.ERROR);
};

export {
  customError,
  createResponse,
  notFoundHandler,
  errorHandler,
  validationErrorHandler,
  ErrorCategory,
  Severity,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createDatabaseError,
  createExternalApiError
};
