/**
 * date-utils.js
 * Päivämäärien käsittelyyn tarkoitetut apufunktiot
 */

/**
 * Muotoilee päivämäärän YYYY-MM-DD -muotoon
 * @param {Date} date - JavaScript Date-objekti
 * @returns {string} - Päivämäärä muodossa YYYY-MM-DD
 */
export function formatDateYYYYMMDD(date) {
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   return `${year}-${month}-${day}`;
}

/**
* Muotoilee päivämäärän ISO-string muodossa, mutta aikavyöhyke huomioiden
* @param {Date} date - JavaScript Date-objekti
* @returns {string} - ISO-muotoinen päivämäärä aikavyöhyke huomioiden
*/
export function formatDateISOString(date) {
   const isoString = date.toISOString();
   const offset = date.getTimezoneOffset();

   // Jos aikavyöhykkeen offsetia ei tarvitse huomioida (UTC), palauta suoraan ISO-string
   if (offset === 0) return isoString;

   // Muuten, lisää aikavyöhykkeen offset
   const offsetHours = Math.floor(Math.abs(offset) / 60);
   const offsetMinutes = Math.abs(offset) % 60;
   const offsetSign = offset > 0 ? '-' : '+';

   const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
   return isoString.replace('Z', offsetString);
}

/**
* Muotoilee päivämäärän lokalisoiduksi merkkijonoksi
* @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
* @param {string} locale - Lokalisaation kieli (esim. 'fi-FI')
* @param {Object} options - Formatointiasetukset
* @returns {string} - Lokalisoitu päivämäärä
*/
export function formatLocalizedDate(dateStr, locale = 'fi-FI', options = {}) {
   const date = new Date(`${dateStr}T00:00:00`);
   const defaultOptions = {
       weekday: 'long',
       year: 'numeric',
       month: 'long',
       day: 'numeric'
   };

   return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
}

/**
* Tarkistaa onko annettu päivä tänään
* @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
* @returns {boolean} - true jos annettu päivä on tänään
*/
export function isToday(dateStr) {
   const today = new Date();
   const todayStr = formatDateYYYYMMDD(today);
   return dateStr === todayStr;
}

/**
* Laskee kaksi päivämäärää luomalla Date-objektit ja vertailemalla niitä
* Tämä auttaa välttämään aikavyöhykeongelmia
* @param {string} date1 - Ensimmäinen päivämäärä YYYY-MM-DD-muodossa
* @param {string} date2 - Toinen päivämäärä YYYY-MM-DD-muodossa
* @returns {number} - Negatiivinen jos date1 < date2, 0 jos date1 = date2, positiivinen jos date1 > date2
*/
export function compareDates(date1, date2) {
   const d1 = new Date(`${date1}T00:00:00`);
   const d2 = new Date(`${date2}T00:00:00`);
   return d1.getTime() - d2.getTime();
}

/**
* Luo Date-objektin annetusta YYYY-MM-DD-muotoisesta päivämäärästä
* @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
* @returns {Date} - Date-objekti
*/
export function createDateFromString(dateStr) {
   return new Date(`${dateStr}T00:00:00`);
}
