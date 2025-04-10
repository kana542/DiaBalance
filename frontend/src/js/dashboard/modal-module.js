import { formatLocalizedDate } from '../utils/date-utils.js';
import { setInputValue, showConfirmDialog, showToast } from '../utils/ui-utils.js';
import { getMonthEntries, updateCalendarView } from './calendar-module.js';
import { saveEntryData, deleteEntryData } from './entry-module.js';
import { fetchAndSaveHrvDataForDay } from './hrv-module.js';

// Moduulin sisäiset muuttujat
let currentModalDate = null;

export function initializeModalModule() {
    setupModalEvents();
    console.log('Modal module initialized');
}

export function openEntryModal(dateStr) {
    console.log("Opening entry modal for date:", dateStr);

    const modal = document.getElementById('entryModal');
    if (!modal) {
        alert('Merkinnän lisäys/muokkaus ei ole käytettävissä.');
        return;
    }

    // Tallenna päivämäärä
    currentModalDate = dateStr;

    // Aseta päivämäärä modaaliin
    modal.setAttribute('data-date', dateStr);

    // Aseta otsikko
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        const formattedDate = formatLocalizedDate(dateStr);
        modalTitle.textContent = `Merkintä: ${formattedDate}`;
    }

    // Tyhjennä lomake
    const entryForm = document.getElementById('entryForm');
    if (entryForm) entryForm.reset();

    // Näytä tai piilota poista-nappi sen mukaan, onko tämä uusi vai olemassa oleva merkintä
    const deleteButton = document.getElementById('deleteButton');
    if (deleteButton) {
        const entry = getMonthEntries()[dateStr];
        if (entry) {
            deleteButton.style.display = 'inline-block';
        } else {
            deleteButton.style.display = 'none';
        }
    }

    // Hae merkintä jos se on olemassa
    const entry = getMonthEntries()[dateStr];

    if (entry) {
        populateEntryForm(entry);
    }

    // Resetoi HRV-napin tila
    resetHrvButton();

    // Näytä modaali
    modal.style.display = 'block';
}

function populateEntryForm(entry) {
    if (!entry) return;

    console.log("Populating form with entry:", entry);

    // Perusseuranta
    setInputValue('morningValue', entry.morningValue);
    setInputValue('eveningValue', entry.eveningValue);

    // Ateriat
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

    // Tyhjennä ensin kaikki oireet
    document.querySelectorAll('input[name="symptoms"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Oireet
    if (entry.symptoms && Array.isArray(entry.symptoms)) {
        entry.symptoms.forEach(symptom => {
            const checkbox = document.querySelector(`input[name="symptoms"][value="${symptom}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    // Kommentti
    setInputValue('comment', entry.comment);
}

/**
 * Sulkee modaali-ikkunan
 */
export function closeEntryModal() {
    const modal = document.getElementById('entryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Resetoi HRV-napin tila
 */
function resetHrvButton() {
    const fetchHrvBtn = document.getElementById('fetchHrvButton');
    if (fetchHrvBtn) {
        fetchHrvBtn.textContent = 'Hae HRV-data';
        fetchHrvBtn.disabled = false;
    }
}

/**
 * Asettaa modaalin tapahtumien käsittelijät
 */
function setupModalEvents() {
    const modal = document.getElementById('entryModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelButton');
    const saveBtn = document.getElementById('saveButton');
    const deleteBtn = document.getElementById('deleteButton');
    const fetchHrvBtn = document.getElementById('fetchHrvButton');

    // Sulje-napin toiminta
    if (closeBtn) closeBtn.onclick = closeEntryModal;

    // Peruuta-napin toiminta
    if (cancelBtn) cancelBtn.onclick = closeEntryModal;

    // Sulje modaali kun klikataan ulkopuolelta
    window.onclick = event => {
        if (event.target === modal) closeEntryModal();
    };

    // Tallenna-napin toiminta
    if (saveBtn) {
        saveBtn.onclick = () => {
            const dateStr = modal.getAttribute('data-date');
            saveEntryData(dateStr);
        };
    }

    // Poista-napin toiminta
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            const dateStr = modal.getAttribute('data-date');
            showConfirmDialog('Haluatko varmasti poistaa tämän merkinnän?')
                .then(confirmed => {
                    if (confirmed) {
                        deleteEntryData(dateStr);
                    }
                });
        };
    }

    // HRV-napin toiminta (tyhjä toteutus)
    if (fetchHrvBtn) {
        fetchHrvBtn.onclick = async () => {
          const dateStr = modal.getAttribute('data-date');

          // Näytä latauksen tila
          fetchHrvBtn.textContent = 'Haetaan...';
          fetchHrvBtn.disabled = true;

          try {
            // Kutsu HRV-moduulin toteutusta
            const result = await fetchAndSaveHrvDataForDay(dateStr);

            // Näytä ilmoitus
            showToast(result.message || 'HRV-data haettu', result.success ? 'success' : 'warning');

            // Palauta napin tila
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

/**
 * Päivittää modaalin tilan
 */
export function updateModalState() {
    const modal = document.getElementById('entryModal');
    if (!modal || !currentModalDate) return;

    const entry = getMonthEntries()[currentModalDate];
    const deleteButton = document.getElementById('deleteButton');

    // Päivitä poista-napin tila
    if (deleteButton) {
        deleteButton.style.display = entry ? 'inline-block' : 'none';
    }
}
