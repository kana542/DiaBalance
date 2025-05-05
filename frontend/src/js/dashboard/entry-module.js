import { apiGet, apiPut, apiDelete } from '../utils/api-client.js';
import { formatDateYYYYMMDD, formatDateISOString } from '../utils/date-utils.js';
import { showToast, NotificationSeverity } from '../utils/ui-utils.js';
import { updateCalendarView } from './calendar-module.js';
import { showDayData, showEmptyView } from './chart-module.js';

// Kuukauden merkinnät tallennetaan tähän objektiin
export let monthEntries = {};

// Alustaa merkintämoduulin
export function initializeEntryModule() {
    console.log('Entry module initialized');
}

// Lataa kuukauden merkinnät palvelimelta
export async function loadMonthEntries(year, month) {
    console.log(`Loading entries for ${year}-${month}`);

    try {
      // Haetaan merkinnät API:sta
      const entries = await apiGet(`/entries?year=${year}&month=${month}`, false);

      console.log("Entries from server:", entries);

      monthEntries = {};

      // Käsitellään jokainen merkintä
      entries.forEach(entry => {
        if (!entry.pvm) return;

        // Käsitellään päivämäärän eri formaatit
        let dateStr;
        if (typeof entry.pvm === 'string') {
          if (entry.pvm.includes('T')) {
            dateStr = entry.pvm.split('T')[0];
          } else {
            dateStr = entry.pvm;
          }
        } else {
          const date = new Date(entry.pvm);
          dateStr = formatDateISOString(date).split('T')[0];
        }

        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log(`Found entry for date: ${dateStr}`);

          // Muunnetaan backend-muoto frontend-muotoon
          const convertedEntry = convertBackendEntryToFrontend(entry);

          // Lisätään HRV-data jos se löytyy
          if (entry.hrv_data) {
            console.log(`Found HRV data for date: ${dateStr}`, entry.hrv_data);
            convertedEntry.hrv_data = entry.hrv_data;
          }

          monthEntries[dateStr] = convertedEntry;
        } else {
          console.error(`Invalid date format: ${dateStr}`);
        }
      });

      console.log("Processed entries:", monthEntries);
      return monthEntries;
    } catch (error) {
      console.error('Virhe haettaessa merkintöjä:', error);
      showToast('Merkintöjen hakeminen epäonnistui', NotificationSeverity.ERROR);
      return {};
    }
  }

// Muuntaa HRV-datan backend-muotoon tallennusta varten
function convertHrvDataToBackend(dateStr, hrvData) {
  return {
    pvm: dateStr,
    readiness: hrvData.readiness,
    stress: hrvData.stress || hrvData.stress_index,
    bpm: hrvData.bpm || hrvData.mean_hr_bpm,
    sdnn_ms: hrvData.sdnn_ms || hrvData.sdnnMs
  };
}

// Tallentaa merkinnän tiedot palvelimelle
export async function saveEntryData(dateStr) {
    console.log("Saving entry data for date:", dateStr);

    const form = document.getElementById('entryForm');
    if (!form) return false;

    // Kerätään lomakkeen tiedot
    const formData = new FormData(form);

    // Käsittelee kenttäarvon oikein
    const processValue = (value) => {
        if (value === undefined || value === null || value === "") {
            return null;
        }
        return value;
    };

    // Kootaan merkinnän data lomakkeesta
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

    // Kerää valitut oireet
    document.querySelectorAll('input[name="symptoms"]:checked').forEach(checkbox => {
        entryData.symptoms.push(checkbox.value);
    });

    try {
        // Säilytä olemassa oleva HRV-data jos sellaista on
        const existingEntry = monthEntries[dateStr];
        const existingHrvData = existingEntry && existingEntry.hrv_data;

        // Jos on vain HRV-dataa eikä muita arvoja, asetetaan oletuskommentti
        if (existingHrvData && Object.values(entryData).every(value =>
            value === null ||
            (Array.isArray(value) && value.length === 0) ||
            value === '')) {
            entryData.comment = "HRV-datamerkintä";
        }

        // Muunnetaan data backend-muotoon
        const backendData = convertFrontendEntryToBackend(dateStr, entryData);

        console.log("Saving entry to backend with date:", dateStr, backendData);

        // Lähetetään data palvelimelle
        const response = await apiPut('/entries', backendData);
        console.log("Entry save response:", response);

        // Seurataan HRV-datan tallennuksen tilaa
        let hrvSaveSuccess = false;
        
        // Jos on HRV-dataa, tallennetaan se erikseen
        if (existingHrvData) {
            console.log("Saving HRV data separately:", existingHrvData);

            try {
                // Varmistetaan että käytetään yhdenmukaisia kenttien nimiä HRV-datalle
                const hrvDataToSave = {
                    readiness: existingHrvData.readiness,
                    // Käytetään ensisijaisesti tietokannan kenttien nimiä, varavaihtoehtoina muita
                    stress: existingHrvData.stress || existingHrvData.stress_index,
                    bpm: existingHrvData.bpm || existingHrvData.mean_hr_bpm,
                    sdnn_ms: existingHrvData.sdnn_ms || existingHrvData.sdnnMs
                };

                // Tuodaan ja käytetään apiPost-funktiota
                const { apiPost } = await import('../utils/api-client.js');
                const hrvResponse = await apiPost(`/kubios/user-data/${dateStr}`, hrvDataToSave);
                console.log("HRV data save result:", hrvResponse);
                hrvSaveSuccess = true;
            } catch (hrvError) {
                console.error("Failed to save HRV data:", hrvError);
                showToast('HRV-tietojen tallennus epäonnistui', NotificationSeverity.WARNING);
            }
        }

        // Ladataan merkinnät uudelleen tallennuksen jälkeen
        try {
            const { getCurrentMonthYear } = await import('./calendar-module.js');
            const { month, year } = getCurrentMonthYear();

            console.log(`Reloading entries after save for month ${year}-${month}`);
            await loadMonthEntries(year, month);
        } catch (reloadError) {
            console.error("Error reloading entries:", reloadError);
        }

        // Suljetaan modaali ja päivitetään käyttöliittymä
        document.getElementById('entryModal').style.display = 'none';
        updateCalendarView();
        showDayData(dateStr);

        return true;
    } catch (error) {
        console.error('Virhe tallennettaessa merkintää:', error);
        return false;
    }
}

// Poistaa merkinnän tietyltä päivältä
export async function deleteEntryData(dateStr) {
    if (!dateStr || !monthEntries[dateStr]) {
        showToast('Ei merkintää poistettavaksi', NotificationSeverity.ERROR);
        return false;
    }

    try {
        console.log("Deleting entry for date:", dateStr);

        // Lähetetään poistopyyntö palvelimelle
        const response = await apiDelete(`/entries/${dateStr}`);
        console.log("Delete response:", response);

        // Poista merkintä paikallisesta muistista
        delete monthEntries[dateStr];

        // Päivitä käyttöliittymä
        document.getElementById('entryModal').style.display = 'none';
        updateCalendarView();
        showEmptyView(dateStr);

        console.log("Entry deleted successfully");
        return true;
    } catch (error) {
        console.error('Virhe poistettaessa merkintää:', error);
        return false;
    }
}

// Tarkistaa onko merkintä täydellinen (kaikki kentät täytetty)
export function isEntryComplete(entry) {
    if (!entry) return false;

    // Verensokerikentät joiden täyttöastetta tarkistetaan
    const glucoseFields = [
        'morningValue', 'eveningValue',
        'breakfastBefore', 'breakfastAfter',
        'lunchBefore', 'lunchAfter',
        'snackBefore', 'snackAfter',
        'dinnerBefore', 'dinnerAfter',
        'eveningSnackBefore', 'eveningSnackAfter'
    ];

    // Tarkistetaan että kaikki kentät on täytetty
    return glucoseFields.every(field =>
        entry[field] !== undefined &&
        entry[field] !== null &&
        entry[field] !== '');
}

// Muuntaa backend-muotoisen merkinnän frontend-muotoon
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
        return {};
    }
}

// Muuntaa frontend-muotoisen merkinnän backend-muotoon
export function convertFrontendEntryToBackend(dateStr, entry) {
    try {
        return {
            pvm: dateStr,
            hrv_data: null,
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
        return {
            pvm: dateStr,
            oireet: 'Ei oireita',
            kommentti: 'Ei kommentteja'
        };
    }
}