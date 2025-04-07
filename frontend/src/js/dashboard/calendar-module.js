/**
 * calendar-module.js
 * Kalenterin toiminnallisuuteen liittyvät funktiot
 */

import { formatDateYYYYMMDD, isToday } from '../utils/date-utils.js';
import { loadMonthEntries, isEntryComplete } from './entry-module.js';
import { openEntryModal } from './modal-module.js';
import { showDayData } from './chart-module.js';

// Moduulin sisäiset muuttujat
let currentMonth, currentYear;
let selectedDateStr = null;

/**
 * Alustaa kalenterin
 */
export function initializeCalendar() {
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    console.log("Calendar elements:", { monthYearElement, datesElement, prevBtn, nextBtn });

    if (!monthYearElement || !datesElement || !prevBtn || !nextBtn) {
        console.error("Calendar elements missing");
        return;
    }

    // Aseta nykyinen kuukausi ja vuosi
    const today = new Date();
    currentMonth = today.getMonth() + 1; // 1-12
    currentYear = today.getFullYear();

    console.log("Current date:", { currentYear, currentMonth });

    // Alusta kalenteri tyhjillä tiedoilla, jotta sivu latautuu nopeammin
    updateCalendarView();

    // Lataa merkinnät ja päivitä kalenteri uudelleen
    loadMonthEntries(currentYear, currentMonth)
        .then(() => {
            console.log("Month entries loaded, updating calendar");
            updateCalendarView();
        })
        .catch(error => {
            console.error("Failed to load month entries:", error);
        });

    // Lisää tapahtumankäsittelijät kuukausien vaihtamiseen
    prevBtn.addEventListener("click", () => {
        if (currentMonth === 1) {
            currentMonth = 12;
            currentYear--;
        } else {
            currentMonth--;
        }
        console.log("Changing to previous month:", { currentYear, currentMonth });
        loadMonthEntries(currentYear, currentMonth)
            .then(() => updateCalendarView())
            .catch(error => {
                console.error("Failed to load month entries:", error);
                updateCalendarView();
            });
    });

    nextBtn.addEventListener("click", () => {
        if (currentMonth === 12) {
            currentMonth = 1;
            currentYear++;
        } else {
            currentMonth++;
        }
        console.log("Changing to next month:", { currentYear, currentMonth });
        loadMonthEntries(currentYear, currentMonth)
            .then(() => updateCalendarView())
            .catch(error => {
                console.error("Failed to load month entries:", error);
                updateCalendarView();
            });
    });
}

/**
 * Päivittää kalenterinäkymän
 */
export function updateCalendarView() {
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");

    if (!monthYearElement || !datesElement) return;

    // Aseta kuukausi ja vuosi otsikkoon lokalisoituna
    const dateForTitle = new Date(currentYear, currentMonth - 1, 1);
    monthYearElement.textContent = dateForTitle.toLocaleString("fi-FI", {
        month: "long", year: "numeric"
    });

    // Laske kalenterin tiedot
    const firstDayDate = new Date(currentYear, currentMonth - 1, 1);
    const lastDayDate = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDayDate.getDate();

    // Suomalainen viikko (ma=0, su=6)
    let firstDayIndex = firstDayDate.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    let datesHTML = "";

    // Edellisen kuukauden päivät
    for (let i = 0; i < firstDayIndex; i++) {
        const prevDate = new Date(currentYear, currentMonth - 1, -i);
        datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
    }

    // TÄRKEÄ: Debug-tulosteet päivämääräavaimista
    console.log("Entries in month:", Object.keys(getMonthEntries()));

    // Tämän kuukauden päivät
    const today = new Date();
    const todayStr = formatDateYYYYMMDD(today);

    for (let day = 1; day <= daysInMonth; day++) {
        // Muodosta päivämääräavain YYYY-MM-DD muodossa
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Debug: Tulosta, onko tälle päivälle merkintää
        const hasEntry = getMonthEntries()[dateStr] !== undefined;
        if (hasEntry) {
            console.log(`Date ${dateStr} has entry`);
        }

        // Tarkista onko tämä päivä
        const isCurrentDay = dateStr === todayStr;

        // Tarkista onko tämä valittu päivä
        const isSelected = dateStr === selectedDateStr;

        // Tarkista merkinnän tila
        const entryClass = hasEntry ?
            (isEntryComplete(getMonthEntries()[dateStr]) ? 'has-complete-entry' : 'has-partial-entry') : '';
        const todayClass = isCurrentDay ? 'today' : '';
        const selectedClass = isSelected ? 'active' : '';

        datesHTML += `
            <div class="date ${todayClass} ${entryClass} ${selectedClass}" data-date="${dateStr}">
                ${day}
            </div>
        `;
    }

    // Seuraavan kuukauden päivät
    const nextDays = 7 - ((daysInMonth + firstDayIndex) % 7);
    if (nextDays < 7) {
        for (let i = 1; i <= nextDays; i++) {
            datesHTML += `<div class="date inactive">${i}</div>`;
        }
    }

    datesElement.innerHTML = datesHTML;
    setupDateClickHandlers();
}

/**
 * Lisää tapahtumankäsittelijät päivämäärille
 */
function setupDateClickHandlers() {
    document.querySelectorAll('.date:not(.inactive)').forEach(dateElement => {
        // Yksittäinen klikkaus näyttää päivän tiedot
        dateElement.addEventListener('click', (e) => {
            document.querySelectorAll('.date').forEach(el => {
                el.classList.remove('active');
            });
            dateElement.classList.add('active');
            const dateStr = dateElement.getAttribute('data-date');
            selectedDateStr = dateStr;
            showDayData(dateStr);
        });

        // Tuplaklikkaus avaa muokkausikkunan
        dateElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const dateStr = dateElement.getAttribute('data-date');
            selectedDateStr = dateStr;
            openEntryModal(dateStr);
        });
    });
}

/**
 * Palauttaa kuukauden merkinnät
 * @returns {Object} Kuukauden merkinnät
 */
export function getMonthEntries() {
    return window.DiaBalance.entries.monthEntries || {};
}

/**
 * Palauttaa nykyisen kuukauden ja vuoden
 * @returns {Object} Nykyinen kuukausi ja vuosi
 */
export function getCurrentMonthYear() {
    return { month: currentMonth, year: currentYear };
}

/**
 * Palauttaa valitun päivämäärän
 * @returns {string|null} Valittu päivämäärä tai null
 */
export function getSelectedDate() {
    return selectedDateStr;
}

/**
 * Asettaa valitun päivämäärän
 * @param {string} dateStr Päivämäärä YYYY-MM-DD-muodossa
 */
export function setSelectedDate(dateStr) {
    selectedDateStr = dateStr;
}
