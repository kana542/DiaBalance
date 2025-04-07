/**
 * entry-module.js
 * Merkintöjen käsittelyyn liittyvät toiminnot (CRUD)
 */

import { apiGet, apiPut, apiDelete } from '../utils/api-client.js';
import { formatDateYYYYMMDD, formatDateISOString } from '../utils/date-utils.js';
import { showToast } from '../utils/ui-utils.js';
import { updateCalendarView } from './calendar-module.js';
import { showDayData, showEmptyView } from './chart-module.js';

// Moduulin sisäiset muuttujat
export let monthEntries = {}; // Kuukauden merkinnät {päivämäärä: merkintä}

/**
 * Alustaa moduulin
 */
export function initializeEntryModule() {
    // Ei erityistä alustustarvetta, moduuli toimii tarvittaessa
    console.log('Entry module initialized');
}

/**
 * Hae kuukauden merkinnät API:sta huomioiden aikavyöhykkeen
 * @param {number} year - Vuosi
 * @param {number} month - Kuukausi (1-12)
 * @returns {Promise<Object>} - Promise joka palauttaa merkinnät
 */
export async function loadMonthEntries(year, month) {
    console.log(`Loading entries for ${year}-${month}`);

    try {
        const entries = await apiGet(`/entries?year=${year}&month=${month}`);

        console.log("Raw entries from server:", entries);

        // Tyhjennä aiemmat merkinnät
        monthEntries = {};

        // Käsittele merkinnät ja varmista että päivämäärä on oikeassa muodossa
        entries.forEach(entry => {
            if (!entry.pvm) return;

            // Käsittele päivämäärä aikavyöhyke huomioiden
            let dateStr;
            if (typeof entry.pvm === 'string') {
                // Jos päivämäärä on jo string-muodossa
                if (entry.pvm.includes('T')) {
                    // Jos päivämäärässä on aikaleima, ota vain päivämääräosa
                    dateStr = entry.pvm.split('T')[0];
                } else {
                    // Jos päivämäärä on jo YYYY-MM-DD muodossa
                    dateStr = entry.pvm;
                }
            } else {
                // Jos päivämäärä on jokin muu muoto
                const date = new Date(entry.pvm);
                dateStr = formatDateISOString(date).split('T')[0];
            }

            // Varmista että päivämäärä on oikeassa muodossa
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                console.log(`Found entry for date: ${dateStr}`);
                monthEntries[dateStr] = convertBackendEntryToFrontend(entry);
            } else {
                console.error(`Invalid date format: ${dateStr}`);
            }
        });

        console.log("Processed entries:", monthEntries);
        return monthEntries;
    } catch (error) {
        console.error('Virhe haettaessa merkintöjä:', error);
        showToast('Merkintöjen hakeminen epäonnistui', 'error');
        return {};
    }
}

/**
 * Tallenna merkintä
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 * @returns {Promise<boolean>} - Promise joka palauttaa true jos tallennus onnistui
 */
export async function saveEntryData(dateStr) {
    console.log("Saving entry data for date:", dateStr);

    const form = document.getElementById('entryForm');
    if (!form) return false;

    // Kerää tiedot lomakkeelta
    const formData = new FormData(form);

    // Käsittele arvot niin, että tyhjät arvot muutetaan null-arvoiksi
    const processValue = (value) => {
        if (value === undefined || value === null || value === "") {
            return null;
        }
        return value;
    };

    const entryData = {
        morningValue: processValue(formData.get('morningValue')),
        eveningValue: processValue(formData.get('eveningValue')),
        breakfastBefore: processValue(formData.get('breakfastBefore')),
        breakfastAfter: processValue(formData.get('breakfastAfter')),
        lunchBefore: processValue(formData.get('lunchBefore')),
        lunchAfter: processValue(formData.get('lunchAfter')),
        snackBefore: processValue(formData.get('snackBefore')),
        snackAfter: processValue(formData.get('snackAfter')),
        dinnerBefore: processValue(formData.get('dinnerBefore')),
        dinnerAfter: processValue(formData.get('dinnerAfter')),
        eveningSnackBefore: processValue(formData.get('eveningSnackBefore')),
        eveningSnackAfter: processValue(formData.get('eveningSnackAfter')),
        symptoms: [],
        comment: processValue(formData.get('comment'))
    };

    // Oireet
    document.querySelectorAll('input[name="symptoms"]:checked').forEach(checkbox => {
        entryData.symptoms.push(checkbox.value);
    });

    try {
        // Varmista, että päivämäärä on oikeassa muodossa
        const backendDateStr = dateStr; // Käytä samaa muotoa kuin frontend-puolella

        const backendData = convertFrontendEntryToBackend(dateStr, entryData);

        console.log("Saving entry to backend with date:", backendDateStr, backendData);

        // Lähetä palvelimelle
        const response = await apiPut('/entries', backendData);

        console.log("Save response:", response);

        // Päivitä merkintä myös muistissa olevaan taulukkoon
        monthEntries[dateStr] = entryData;

        // Ilmoita onnistuneesta tallennuksesta
        showToast('Merkintä tallennettu onnistuneesti', 'success');

        // Päivitä UI
        document.getElementById('entryModal').style.display = 'none';
        updateCalendarView(); // Päivitä kalenteri
        showDayData(dateStr); // Päivitä päivän tiedot

        console.log("Entry saved successfully");
        return true;
    } catch (error) {
        console.error('Virhe tallennettaessa merkintää:', error);
        showToast('Merkinnän tallennus epäonnistui', 'error');
        return false;
    }
}

/**
 * Poista merkintä
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 * @returns {Promise<boolean>} - Promise joka palauttaa true jos poisto onnistui
 */
export async function deleteEntryData(dateStr) {
    if (!dateStr || !monthEntries[dateStr]) {
        showToast('Ei merkintää poistettavaksi', 'error');
        return false;
    }

    if (!confirm('Haluatko varmasti poistaa tämän merkinnän?')) {
        return false;
    }

    try {
        console.log("Deleting entry for date:", dateStr);

        // Lähetä DELETE pyyntö palvelimelle
        const response = await apiDelete(`/entries/${dateStr}`);

        console.log("Delete response:", response);

        // Poista merkintä muistista
        delete monthEntries[dateStr];

        // Ilmoita onnistuneesta poistosta
        showToast('Merkintä poistettu onnistuneesti', 'success');

        // Päivitä UI
        document.getElementById('entryModal').style.display = 'none';
        updateCalendarView(); // Päivitä kalenteri
        showEmptyView(dateStr); // Näytä tyhjä näkymä

        console.log("Entry deleted successfully");
        return true;
    } catch (error) {
        console.error('Virhe poistettaessa merkintää:', error);
        showToast('Merkinnän poisto epäonnistui', 'error');
        return false;
    }
}

/**
 * Tarkista onko merkintä täydellinen (kaikki verensokeriarvot täytetty)
 * @param {Object} entry - Merkintä
 * @returns {boolean} - true jos merkintä on täydellinen
 */
export function isEntryComplete(entry) {
    if (!entry) return false;

    // Vain verensokeriarvoille tarkistus merkintöjen väriä varten
    const glucoseFields = [
        'morningValue', 'eveningValue',
        'breakfastBefore', 'breakfastAfter',
        'lunchBefore', 'lunchAfter',
        'snackBefore', 'snackAfter',
        'dinnerBefore', 'dinnerAfter',
        'eveningSnackBefore', 'eveningSnackAfter'
    ];

    // Tarkista että kaikki verensokeriarvot ovat täytetty
    return glucoseFields.every(field =>
        entry[field] !== undefined &&
        entry[field] !== null &&
        entry[field] !== '');
}

/**
 * Muunna backend-merkintä frontend-muotoon
 * @param {Object} entry - Backend-merkintä
 * @returns {Object} - Frontend-merkintä
 */
export function convertBackendEntryToFrontend(entry) {
    try {
        const result = {
            morningValue: entry.vs_aamu,
            eveningValue: entry.vs_ilta,
            breakfastBefore: entry.vs_aamupala_ennen,
            breakfastAfter: entry.vs_aamupala_jalkeen,
            lunchBefore: entry.vs_lounas_ennen,
            lunchAfter: entry.vs_lounas_jalkeen,
            snackBefore: entry.vs_valipala_ennen,
            snackAfter: entry.vs_valipala_jalkeen,
            dinnerBefore: entry.vs_paivallinen_ennen,
            dinnerAfter: entry.vs_paivallinen_jalkeen,
            eveningSnackBefore: entry.vs_iltapala_ennen,
            eveningSnackAfter: entry.vs_iltapala_jalkeen,
            symptoms: entry.oireet === 'Ei oireita' ? [] : entry.oireet.split(','),
            comment: entry.kommentti === 'Ei kommentteja' ? '' : entry.kommentti
        };

        return result;
    } catch (error) {
        console.error("Error converting backend entry to frontend:", error, entry);
        return {}; // Tyhjä objekti virheen sattuessa
    }
}

/**
 * Muunna frontend-merkintä backend-muotoon
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 * @param {Object} entry - Frontend-merkintä
 * @returns {Object} - Backend-merkintä
 */
export function convertFrontendEntryToBackend(dateStr, entry) {
    try {
        // Varmistetaan että päivämäärä on mukana
        return {
            pvm: dateStr,
            hrv_data: null, // HRV-toiminnallisuudet on poistettu
            vs_aamu: entry.morningValue,
            vs_ilta: entry.eveningValue,
            vs_aamupala_ennen: entry.breakfastBefore,
            vs_aamupala_jalkeen: entry.breakfastAfter,
            vs_lounas_ennen: entry.lunchBefore,
            vs_lounas_jalkeen: entry.lunchAfter,
            vs_valipala_ennen: entry.snackBefore,
            vs_valipala_jalkeen: entry.snackAfter,
            vs_paivallinen_ennen: entry.dinnerBefore,
            vs_paivallinen_jalkeen: entry.dinnerAfter,
            vs_iltapala_ennen: entry.eveningSnackBefore,
            vs_iltapala_jalkeen: entry.eveningSnackAfter,
            oireet: entry.symptoms && entry.symptoms.length > 0 ? entry.symptoms.join(',') : 'Ei oireita',
            kommentti: entry.comment || 'Ei kommentteja'
        };
    } catch (error) {
        console.error("Error converting frontend entry to backend:", error, entry);
        // Vähimmäisvaatimukset, että pyyntö ei kaadu
        return {
            pvm: dateStr,
            oireet: 'Ei oireita',
            kommentti: 'Ei kommentteja'
        };
    }
}
