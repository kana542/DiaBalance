import { formatLocalizedDate } from '../utils/date-utils.js';
import { setInputValue, showConfirmDialog, showToast } from '../utils/ui-utils.js';
import { getMonthEntries, updateCalendarView } from './calendar-module.js';
import { saveEntryData, deleteEntryData } from './entry-module.js';
import { fetchAndSaveHrvDataForDay } from './hrv-module.js';
import { setupBloodSugarValidation } from '../utils/blood-sugar-validation.js';

// Nykyisen modaalin päivämäärä
let currentModalDate = null;

// Alustaa modaalimoduulin toiminnallisuuden
export function initializeModalModule() {
    console.log('Initializing modal module');
    setupModalEvents();
    // Lisätään verensokeriarvojen validointi
    setupEntryModalBloodSugarValidation();
    console.log('Modal module initialized with blood sugar validation');

    // Piilotetaan peruuta-nappi (ei käytössä nykyisessä toteutuksessa)
    const cancelBtn = document.getElementById('cancelButton');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
}

// Avaa merkinnän muokkausmodaalin tietylle päivälle
export function openEntryModal(dateStr) {
    console.log("Opening entry modal for date:", dateStr);

    // Haetaan modaalielementti
    const modal = document.getElementById('entryModal');
    if (!modal) {
        alert('Merkinnän lisäys/muokkaus ei ole käytettävissä.');
        return;
    }

    // Tallennetaan päivämäärä
    currentModalDate = dateStr;

    // Asetetaan päivämäärä modaaliin data-attribuuttina
    modal.setAttribute('data-date', dateStr);

    // Asetetaan otsikko
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        const formattedDate = formatLocalizedDate(dateStr);
        modalTitle.textContent = `Merkintä: ${formattedDate}`;
    }

    // Tyhjennetään lomake
    const entryForm = document.getElementById('entryForm');
    if (entryForm) entryForm.reset();

    // Resetoidaan lomakekenttien tyylit ja kuuntelijat
    resetFormInputs();

    // Näytetään tai piilotetaan poista-nappi sen mukaan, onko merkintä olemassa
    const deleteButton = document.getElementById('deleteButton');
    if (deleteButton) {
        const entry = getMonthEntries()[dateStr];
        if (entry) {
            deleteButton.style.display = 'inline-block';
        } else {
            deleteButton.style.display = 'none';
        }
    }

    // Haetaan merkintä jos se on olemassa
    const entry = getMonthEntries()[dateStr];
    if (entry) {
        populateEntryForm(entry);
    }

    // Resetoidaan HRV-napin tila
    resetHrvButton();

    // Näytetään modaali
    modal.style.display = 'block';
    
    // Varmistetaan että validointi on aktiivinen uusille kentille
    setupEntryModalBloodSugarValidation();
}

// Poistaa vanhat kuuntelijat ja tyylit lomakekentistä
function resetFormInputs() {
    // Kaikki verensokerikentät
    const bloodSugarFields = [
        'morningValue', 'eveningValue',
        'breakfastBefore', 'breakfastAfter',
        'lunchBefore', 'lunchAfter',
        'snackBefore', 'snackAfter',
        'dinnerBefore', 'dinnerAfter',
        'eveningSnackBefore', 'eveningSnackAfter'
    ];

    // Resetoidaan jokaisen kentän tyylit ja virheilmoitukset
    bloodSugarFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            // Poistetaan reunatyylit
            input.style.borderColor = '';

            // Poistetaan validointiviestit
            const feedback = input.parentNode.querySelector('.validation-feedback');
            if (feedback) {
                feedback.remove();
            }
        }
    });

    // Poistetaan kaikki verensokeriin liittyvät toast-ilmoitukset
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        const toasts = toastContainer.querySelectorAll('.toast');
        toasts.forEach(toast => {
            if (toast.textContent.includes('välillä 0-30 mmol/l')) {
                toast.remove();
            }
        });
    }
}

// Täyttää lomakkeen olemassa olevan merkinnän tiedoilla
function populateEntryForm(entry) {
    if (!entry) return;

    console.log("Populating form with entry:", entry);

    // Täytetään perusseurannan arvot
    setInputValue('morningValue', entry.morningValue);
    setInputValue('eveningValue', entry.eveningValue);

    // Täytetään aterioiden arvot
    setInputValue('breakfastBefore', entry.breakfastBefore);
    setInputValue('breakfastAfter', entry.breakfastAfter);
    setInputValue('lunchBefore', entry.lunchBefore);
    setInputValue('lunchAfter', entry.lunchAfter);
    setInputValue('snackBefore', entry.snackBefore);
    setInputValue('snackAfter', entry.snackAfter);
    setInputValue('dinnerBefore', entry.dinnerBefore);
    setInputValue('dinnerAfter', entry.dinnerAfter);
    setInputValue('eveningSnackBefore', entry.eveningSnackBefore);
    setInputValue('eveningSnackAfter', entry.eveningSnackAfter);

    // Tyhjennätään ensin kaikki oireet
    document.querySelectorAll('input[name="symptoms"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Valitaan oireet merkinnästä
    if (entry.symptoms && Array.isArray(entry.symptoms)) {
        entry.symptoms.forEach(symptom => {
            const checkbox = document.querySelector(`input[name="symptoms"][value="${symptom}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    // Täytetään kommentti
    setInputValue('comment', entry.comment);
}

// Validoi kaikki verensokeriarvot ennen lomakkeen lähetystä
function validateAllBloodSugarValues(formData) {
    const bloodSugarFields = [
        'morningValue', 'eveningValue',
        'breakfastBefore', 'breakfastAfter',
        'lunchBefore', 'lunchAfter',
        'snackBefore', 'snackAfter',
        'dinnerBefore', 'dinnerAfter',
        'eveningSnackBefore', 'eveningSnackAfter'
    ];

    let isValid = true;

    // Tarkistetaan jokainen kenttä
    bloodSugarFields.forEach(field => {
        const value = formData.get(field);

        // Tyhjät arvot ovat sallittuja
        if (value === null || value === undefined || value === '') {
            return;
        }

        // Tarkistetaan arvoalue ja muotoilu
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 30) {
            isValid = false;

            // Korostetaan virheellinen kenttä
            const input = document.getElementById(field);
            if (input) {
                input.style.borderColor = '#e74c3c';
                
                // Tarkistetaan onko palauteelementti jo olemassa
                let feedbackElement = input.parentNode.querySelector('.validation-feedback');
                if (!feedbackElement) {
                    // Luodaan palauteelementti jos sitä ei ole
                    feedbackElement = document.createElement('div');
                    feedbackElement.className = 'validation-feedback';
                    feedbackElement.style.fontSize = '12px';
                    feedbackElement.style.marginTop = '5px';
                    feedbackElement.style.color = '#e74c3c';
                    input.parentNode.insertBefore(feedbackElement, input.nextSibling);
                }
                
                feedbackElement.textContent = 'Arvon tulee olla välillä 1-30 mmol/l';
                feedbackElement.style.display = 'block';
            }
        }
    });

    return isValid;
}

// Sulkee modaali-ikkunan
export function closeEntryModal() {
    const modal = document.getElementById('entryModal');
    if (modal) {
        modal.style.display = 'none';

        // Resetoidaan validointivirheet suljettaessa
        resetFormInputs();
    }
}

// Resetoi HRV-napin tilan
function resetHrvButton() {
    const fetchHrvBtn = document.getElementById('fetchHrvButton');
    if (fetchHrvBtn) {
        fetchHrvBtn.textContent = 'Hae HRV-data';
        fetchHrvBtn.disabled = false;
    }
}

// Asettaa modaalin tapahtumien käsittelijät
function setupModalEvents() {
    const modal = document.getElementById('entryModal');
    if (!modal) return;

    // Haetaan tarvittavat napit
    const closeBtn = modal.querySelector('.close-modal');
    const saveBtn = document.getElementById('saveButton');
    const deleteBtn = document.getElementById('deleteButton');
    const fetchHrvBtn = document.getElementById('fetchHrvButton');

    // Lisätään sulkunapille toiminnallisuus
    if (closeBtn) closeBtn.onclick = closeEntryModal;

    // Lisätään tallennusnapille toiminnallisuus
    if (saveBtn) {
        saveBtn.onclick = () => {
            const dateStr = modal.getAttribute('data-date');
            const form = document.getElementById('entryForm');

            if (form) {
                const formData = new FormData(form);

                // Validoidaan arvot ennen tallennusta
                if (!validateAllBloodSugarValues(formData)) {
                    return; // Pysäytetään tallentaminen jos validointi epäonnistuu
                }

                // Tallennetaan merkintä
                saveEntryData(dateStr);
            }
        };
    }

    // Lisätään poistonapille toiminnallisuus
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            const dateStr = modal.getAttribute('data-date');
            // Varmistetaan että käyttäjä haluaa varmasti poistaa merkinnän
            showConfirmDialog('Haluatko varmasti poistaa tämän merkinnän?')
                .then(confirmed => {
                    if (confirmed) {
                        deleteEntryData(dateStr);
                    }
                });
        };
    }

    // Lisätään HRV-datan hakunapille toiminnallisuus
    if (fetchHrvBtn) {
        fetchHrvBtn.onclick = async () => {
          const dateStr = modal.getAttribute('data-date');

          // Näytetään latauksen tila napissa
          fetchHrvBtn.textContent = 'Haetaan...';
          fetchHrvBtn.disabled = true;

          try {
            // Haetaan HRV-data
            const result = await fetchAndSaveHrvDataForDay(dateStr);

            // Näytetään ilmoitus haun tuloksesta
            showToast(result.message || 'HRV-data haettu', result.success ? 'success' : 'warning');

            // Palautetaan napin tila
            fetchHrvBtn.textContent = 'Hae HRV-data';
            fetchHrvBtn.disabled = false;
          } catch (error) {
            console.error('Virhe HRV-toiminnossa:', error);
            fetchHrvBtn.textContent = 'Virhe';
            fetchHrvBtn.disabled = false;
            showToast('Virhe HRV-datan hakemisessa', 'error');
          }
        };
    }
}

// Liittää validoinnin modal-lomakkeen verensokerisyöttökenttiin
export function setupEntryModalBloodSugarValidation() {
    console.log('Setting up blood sugar validation for modal fields');
    
    // Verensokerisyöttökenttien ID:t
    const bloodSugarInputIds = [
        'morningValue', 'eveningValue',
        'breakfastBefore', 'breakfastAfter',
        'lunchBefore', 'lunchAfter',
        'snackBefore', 'snackAfter',
        'dinnerBefore', 'dinnerAfter',
        'eveningSnackBefore', 'eveningSnackAfter'
    ];

    // Lisätään validointi jokaiseen kenttään
    bloodSugarInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            console.log(`Setting up real-time validation for field: ${id}`);
            setupBloodSugarValidation(input);
        } else {
            console.warn(`Field not found: ${id}`);
        }
    });
}

// Päivittää modaalin tilan
export function updateModalState() {
    const modal = document.getElementById('entryModal');
    if (!modal || !currentModalDate) return;

    const entry = getMonthEntries()[currentModalDate];
    const deleteButton = document.getElementById('deleteButton');

    // Päivitetään poista-napin näkyvyys
    if (deleteButton) {
        deleteButton.style.display = entry ? 'inline-block' : 'none';
    }
}