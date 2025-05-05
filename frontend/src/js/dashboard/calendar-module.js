import { formatDateYYYYMMDD, isToday } from '../utils/date-utils.js';
import { loadMonthEntries, isEntryComplete } from './entry-module.js';
import { openEntryModal } from './modal-module.js';
import { showDayData } from './chart-module.js';

// Kalenterin tilan hallinta
let currentMonth, currentYear;
let selectedDateStr = null;

// Alustaa kalenterin toiminnallisuuden
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

    // Asetetaan kuluva kuukausi ja vuosi
    const today = new Date();
    currentMonth = today.getMonth() + 1; // 1-12
    currentYear = today.getFullYear();

    console.log("Current date:", { currentYear, currentMonth });

    // Päivitetään kalenterinäkymä
    updateCalendarView();

    // Ladataan merkinnät valitulle kuukaudelle
    loadMonthEntries(currentYear, currentMonth)
        .then(() => {
            console.log("Month entries loaded, updating calendar");
            updateCalendarView();
        })
        .catch(error => {
            console.error("Failed to load month entries:", error);
        });

    // Asetetaan kuukausien navigointinappien toiminnallisuus
    prevBtn.addEventListener("click", () => {
        // Siirrytään edelliseen kuukauteen
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
        // Siirrytään seuraavaan kuukauteen
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

// Päivittää kalenterinäkymän valitun kuukauden perusteella
export function updateCalendarView() {
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");

    if (!monthYearElement || !datesElement) return;

    // Asetetaan kuukauden otsikko
    const dateForTitle = new Date(currentYear, currentMonth - 1, 1);
    monthYearElement.textContent = dateForTitle.toLocaleString("fi-FI", {
        month: "long", year: "numeric"
    });

    // Määritetään kuukauden aloitus- ja lopetuspäivä
    const firstDayDate = new Date(currentYear, currentMonth - 1, 1);
    const lastDayDate = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDayDate.getDate();

    // Määritetään viikon päivien järjestys (0=ma, 6=su)
    let firstDayIndex = firstDayDate.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    let datesHTML = "";

    // Lisätään edellisen kuukauden päivät
    for (let i = 0; i < firstDayIndex; i++) {
        const prevDate = new Date(currentYear, currentMonth - 1, -i);
        datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
    }

    console.log("Entries in month:", Object.keys(getMonthEntries()));

    const today = new Date();
    const todayStr = formatDateYYYYMMDD(today);

    // Lisätään kuukauden päivät kalenteriin
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEntry = getMonthEntries()[dateStr] !== undefined;
        if (hasEntry) {
            console.log(`Date ${dateStr} has entry`);
        }
        const isCurrentDay = dateStr === todayStr;
        const isSelected = dateStr === selectedDateStr;
        // Määritetään CSS-luokat päivän tilan mukaan
        const entryClass = hasEntry ?
            (isEntryComplete(getMonthEntries()[dateStr]) ? 'has-complete-entry' : 'has-partial-entry') : '';
        const todayClass = isCurrentDay ? 'today' : '';
        const selectedClass = isSelected ? 'active' : '';

        datesHTML += `
            <div class="date ${todayClass} ${entryClass} ${selectedClass}" 
            data-date="${dateStr}"
            aria-label="Päivä ${day}, ${hasEntry ? 'sisältää merkinnän' : 'ei merkintöjä'}">
            ${day}
          </div>
        `;
    }

    // Lisätään seuraavan kuukauden päivät täyttämään viimeinen viikko
    const nextDays = 7 - ((daysInMonth + firstDayIndex) % 7);
    if (nextDays < 7) {
        for (let i = 1; i <= nextDays; i++) {
            datesHTML += `<div class="date inactive">${i}</div>`;
        }
    }

    datesElement.innerHTML = datesHTML;
    
    // Lisätään kalenterin päiville tapahtumankäsittelijät
    if (!datesElement._hasEventListeners) {
        // Klikkaus näyttää päivän tiedot
        datesElement.addEventListener('click', (e) => {
            const dateElement = e.target.closest('.date:not(.inactive)');
            if (!dateElement) return;
            
            document.querySelectorAll('.date').forEach(el => {
                el.classList.remove('active');
            });
            dateElement.classList.add('active');
            const dateStr = dateElement.getAttribute('data-date');
            selectedDateStr = dateStr;
            showDayData(dateStr);
        });
        
        // Tuplaklikkaus avaa merkinnän muokkausnäkymän
        datesElement.addEventListener('dblclick', (e) => {
            const dateElement = e.target.closest('.date:not(.inactive)');
            if (!dateElement) return;
            
            e.stopPropagation();
            const dateStr = dateElement.getAttribute('data-date');
            selectedDateStr = dateStr;
            openEntryModal(dateStr);
        });
        
        datesElement._hasEventListeners = true;
    }
}

// Hakee valitun kuukauden merkinnät
export function getMonthEntries() {
    return window.DiaBalance.entries.monthEntries || {};
}

// Palauttaa valitun kuukauden ja vuoden
export function getCurrentMonthYear() {
    return { month: currentMonth, year: currentYear };
}

// Hakee valitun päivämäärän
export function getSelectedDate() {
    return selectedDateStr;
}

// Asettaa valitun päivämäärän
export function setSelectedDate(dateStr) {
    selectedDateStr = dateStr;
}