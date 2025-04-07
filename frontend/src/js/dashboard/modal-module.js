/**
 * modal-module.js
 * Modaali-ikkunoiden hallinta
 */

import { formatLocalizedDate } from '../utils/date-utils.js';
import { setInputValue, showConfirmDialog } from '../utils/ui-utils.js';
import { getMonthEntries, updateCalendarView } from './calendar-module.js';
import { saveEntryData, deleteEntryData } from './entry-module.js';

// Moduulin sisäiset muuttujat
let currentModalDate = null;

/**
 * Alustaa modaali-ikkunoiden toiminnallisuuden
 */
export function initializeModalModule() {
    setupModalEvents();
    console.log('Modal module initialized');
}

/**
 * Avaa merkinnän muokkausikkuna
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 */
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

    // Näytä modaali
    modal.style.display = 'block';
}

/**
 * Täyttää lomakkeen tiedot merkinnän perusteella
 * @param {Object} entry - Merkinnän tiedot
 */
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
 * Asettaa modaalin tapahtumien käsittelijät
 */
function setupModalEvents() {
    const modal = document.getElementById('entryModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelButton');
    const saveBtn = document.getElementById('saveButton');
    const deleteBtn = document.getElementById('deleteButton');

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
