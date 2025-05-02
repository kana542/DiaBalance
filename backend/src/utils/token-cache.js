/**
 * token-cache.js - Kubios-tokenien välimuistijärjestelmä (in-memory välimuistimekanismi)
 * --------------
 * parantaa sovelluksen suorituskykyä vähentämällä tietokantahakuja usein tarvittaville tokeneille.
 *
 * pääominaisuudet:
 *    1. tokenien tallennus Map-tietorakenteeseen muistissa
 *    2. automaattinen tokenien vanhentuminen määritetyn ajan jälkeen
 *    3. yksinkertainen rajapinta tokenien hallintaan
 *
 * toiminnot:
 *    - cacheToken() - tallentaa tokenin välimuistiin ja asettaa automaattisen vanhentumisen
 *    - getTokenFromCache() - hakee tokenin välimuistista käyttäjä-ID:n perusteella
 *    - removeTokenFromCache() - poistaa tokenin välimuistista (käytetään uloskirjautuessa)
 *
 * käyttö sovelluksessa:
 *    - käytetään user-model.js:ssä Kubios-tokenien tehokkaaseen hallintaan
 *    - integroi muistivälimuistin tietokantatallennettujen tokenien rinnalle
 *    - optimoi kubios-controller.js:n API-kutsuja vähentämällä tietokantaoperaatioita
 */

import logger from "./logger.js"

// tokenivälimuistin tietorakenne - käytetään Map-tietorakennetta, joka mahdollistaa avain-arvo-parit
const tokenCache = new Map();

/**
 * tallentaa annetun Kubios-tokenin välimuistiin tietylle käyttäjälle
 * @param {number} userId - käyttäjän ID
 * @param {string} token - Kubios API token
 * @param {Date} expiration - tokenin vanhentumisaika
 */
export function cacheToken(userId, token, expiration) {
   // tarkistetaan, että kaikki pakolliset parametrit on annettu
   if (!userId || !token || !expiration) return;

   // lokitetaan toimenpide
   logger.debug(`Caching Kubios token for user ${userId}`);

   // tallennetaan token välimuistiin käyttäen käyttäjän ID:tä avaimena
   tokenCache.set(userId, token);

   // asetetaan ajastin, joka poistaa tokenin välimuistista kun se vanhenee
   const timeUntilExpiry = new Date(expiration).getTime() - Date.now();
   if (timeUntilExpiry > 0) {
      setTimeout(() => {
         logger.debug(`Token cache expiring for user ${userId}`);
         // poistetaan automaattisesti token välimuistista, kun se vanhenee
         tokenCache.delete(userId);
      }, timeUntilExpiry);
   }
}

/**
 * hakee Kubios-tokenin välimuistista tietyn käyttäjän ID:n perusteella
 * @param {number} userId - käyttäjän ID
 * @returns {string|null} token jos löytyy, muuten null
 */
export function getTokenFromCache(userId) {
   // tarkistetaan, onko käyttäjälle olemassa tokenia välimuistissa
   if (tokenCache.has(userId)) {
      logger.debug(`Token found in cache for user ${userId}`);
      // palautetaan löydetty token
      return tokenCache.get(userId);
   }
   // jos tokenia ei löydy, palautetaan null
   return null;
}

/**
 * poistaa Kubios-tokenin välimuistista esim. uloskirjautumisen yhteydessä
 * @param {number} userId - käyttäjän ID
 */
export function removeTokenFromCache(userId) {
   logger.debug(`Removing token from cache for user ${userId}`);
   // poistetaan token välimuistista käyttäjän ID:n perusteella
   tokenCache.delete(userId);
}
