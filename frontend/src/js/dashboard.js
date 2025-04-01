/**
 * Dashboard.js - DiaBalance sovelluksen dashboard-toiminnallisuus
 * Sisältää kalenterin, verensokeri- ja HRV-seurannat
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard loading...");
    
    // Uloskirjautumisnapin alustus
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Käyttäjänimen näyttäminen, jos saatavilla
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                usernameElement.textContent = user.username || 'Käyttäjä';
            }
        } catch (error) {
            console.error('Virhe käyttäjätietojen käsittelyssä:', error);
        }
    }

    // Alustetaan dashboard-komponentit
    initializeDashboard();
});

/**
 * Käsittelee uloskirjautumistoiminnon ja ohjaa käyttäjän takaisin menu-näkymään
 */
function handleLogout() {
    console.log('Uloskirjautuminen...');
    
    // Poista token ja käyttäjätiedot local storagesta
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Näytä viesti käyttäjälle
    alert('Olet kirjautunut ulos onnistuneesti.');
    
    // Ohjaa käyttäjä takaisin päävalikkoon/etusivulle
    window.location.href = '../../index.html';
}

/**
 * Alustaa kaikki dashboard-komponentit
 */
function initializeDashboard() {
    console.log("Alustetaan dashboard-komponentit...");
    
    // Alustetaan kalenteri
    initializeCalendar();
    
    // Alustetaan kaavionäkymä
    initializeChartPlaceholder();
    
    // Lisätään info-napit komponenteille (lukuunottamatta kalenteria, se lisätään erikseen)
    setupComponentInfoButtons();
}

/**
 * Alustaa kalenterin toiminnallisuuden
 */
function initializeCalendar() {
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!monthYearElement || !datesElement || !prevBtn || !nextBtn) {
        console.error("Kalenterin elementtejä ei löydy!");
        return;
    }

    let currentDate = new Date();

    // Funktio merkintöjen hakemiseen nykyiselle kuukaudelle
    // Tämä on vain esimerkki ja tulisi korvata todellisella API-kutsulla
    const fetchMonthEntries = async () => {
        try {
            // Kehitysversiossa palautetaan testidataa
            // Puuttuvan API:n vuoksi käytämme kovakoodattua dataa
            return [
                { date: '2025-04-01', isComplete: true },
                { date: '2025-04-02', isComplete: false },
                { date: '2025-04-09', isComplete: true },
                { date: '2025-04-13', isComplete: false },
                { date: '2025-04-15', isComplete: true }
            ];
            
            /* Todellinen API-kutsu, kun backend on valmis:
            const token = localStorage.getItem('token');
            if (!token) return [];
            
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // JavaScript kuukaudet ovat 0-indeksoituja
            
            const response = await fetch(`http://localhost:3000/api/entries/month/${year}/${month}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Merkintöjen haku epäonnistui');
            }
            
            return await response.json();
            */
        } catch (error) {
            console.error('Virhe haettaessa kuukauden merkintöjä:', error);
            return [];
        }
    };
    
    const updateCalendar = async () => {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();

        // Korjaa viikon alkamaan maanantaista (0 = maanantai ruudukossamme)
        let firstDayIndex = firstDay.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6; // Sunnuntai tulee arvoksi 6

        let lastDayIndex = lastDay.getDay() - 1;
        if (lastDayIndex === -1) lastDayIndex = 6;

        const monthYearString = currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });
        monthYearElement.textContent = monthYearString;

        // Hae merkinnät kuukaudelle
        const monthEntries = await fetchMonthEntries();
        
        // Luo kartta päivistä, joilla on merkintöjä
        const entriesMap = new Map();
        monthEntries.forEach(entry => {
            const date = new Date(entry.date);
            const day = date.getDate();
            entriesMap.set(day, {
                isComplete: entry.isComplete
            });
        });

        let datesHTML = "";

        // Edellisen kuukauden päivät
        for (let i = firstDayIndex; i > 0; i--) {
            const prevDate = new Date(currentYear, currentMonth, 0 - i + 1);
            datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
        }

        // Nykyisen kuukauden päivät
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const today = new Date();

            // Tarkista onko päivä tänään
            const isToday = date.getDate() === today.getDate() &&
                           date.getMonth() === today.getMonth() &&
                           date.getFullYear() === today.getFullYear();

            // Tarkista onko päivällä merkintä
            const hasEntry = entriesMap.has(i);
            
            // Määritä CSS-luokat merkinnän tilan perusteella
            let notificationClass = '';
            if (hasEntry) {
                const entryInfo = entriesMap.get(i);
                notificationClass = entryInfo.isComplete ? 'has-complete-entry' : 'has-partial-entry';
            }
            
            const activeClass = isToday ? "active" : "";

            datesHTML += `<div class="date ${activeClass} ${notificationClass}" data-date="${i}">${i}</div>`;
        }

        // Seuraavan kuukauden päivät
        for (let i = 1; i <= 7 - lastDayIndex - 1; i++) {
            const nextDate = new Date(currentYear, currentMonth + 1, i);
            datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;
        }

        datesElement.innerHTML = datesHTML;

        // Lisää klikkaustapahtumankäsittelijät päivämäärille
        document.querySelectorAll('.date:not(.inactive)').forEach(dateElement => {
            // Yksittäinen klikkaus valitsee päivän ja lataa tiedot
            dateElement.addEventListener('click', () => {
                // Poista active-luokka kaikilta päiviltä
                document.querySelectorAll('.date').forEach(el => {
                    el.classList.remove('active');
                });

                // Lisää active-luokka klikatulle päivälle
                dateElement.classList.add('active');
                
                // Hae valitun päivän tiedot
                const day = parseInt(dateElement.getAttribute('data-date'));
                const selectedDate = new Date(currentYear, currentMonth, day);
                const formattedDate = selectedDate.toISOString().split('T')[0];
                console.log(`Valittiin päivä: ${formattedDate}`);
                
                // Tässä kutsuisimme funktiota päivän tietojen lataamiseksi
                // loadDayData(formattedDate);
            });
            
            // Tuplaklikkaus avaa modaalin merkinnän lisäystä/muokkausta varten
            dateElement.addEventListener('dblclick', () => {
                const day = parseInt(dateElement.getAttribute('data-date'));
                const selectedDate = new Date(currentYear, currentMonth, day);
                const formattedDate = selectedDate.toISOString().split('T')[0];
                console.log(`Tuplaklikkaus päivälle: ${formattedDate} - avattaisiin modaali`);
                
                // Tässä avaisimme modaalin merkinnän muokkausta varten
                // openEntryModal(formattedDate);
                alert(`Tässä aukeaisi modaali merkinnän lisäämiseksi/muokkaamiseksi päivälle ${formattedDate}`);
            });
        });
    };

    // Lisää tapahtumankäsittelijät edellinen/seuraava napeille
    prevBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    // Lisää info-nappi kalenteriin
    addCalendarInfoButton();

    // Alusta kalenteri
    updateCalendar();
}

/**
 * Lisää info-napin kalenterin otsikkoriville
 */
function addCalendarInfoButton() {
    // Etsi kalenterin header-elementti
    const calendarHeader = document.querySelector(".calendar-header");
    
    if (calendarHeader) {
        // Luo info-nappi
        const infoButton = document.createElement("button");
        infoButton.className = "calendar-info-btn"; 
        infoButton.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
        infoButton.setAttribute("title", "Kalenterin ohje");
        
        // Lisää nappi kalenterin headeriin monthYear-elementin ja nextBtn:n väliin
        const monthYearElem = document.querySelector(".monthYear");
        if (monthYearElem && monthYearElem.nextSibling) {
            calendarHeader.insertBefore(infoButton, monthYearElem.nextSibling);
        } else {
            // Jos nextSibling ei toimi, lisätään se headeriin
            calendarHeader.appendChild(infoButton);
        }
        
        // Lisää tapahtumankäsittelijä info-napille
        infoButton.addEventListener("click", function() {
            alert("Kalenteri: Klikkaa päivämäärää nähdäksesi sen päivän tiedot. Tuplaklikkaa päivämäärää lisätäksesi tai muokataksesi merkintää. Punaisella merkityt päivät sisältävät täydellisiä merkintöjä, oranssilla merkityt osittaisia merkintöjä.");
        });
    }
}

/**
 * Alustaa kaavio-osion
 */
function initializeChartPlaceholder() {
    // Mittaustyypin vaihtologiikka
    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        // Lisää tapahtumankäsittelijä mittaustyypin vaihtoon
        measurementTypeSelect.addEventListener('change', function() {
            if (this.value === 'Perus') {
                mealTypeGroup.style.display = 'none';
            } else {
                mealTypeGroup.style.display = 'flex';
            }
        });

        // Alusta näkyvyys nykyisen valinnan mukaan
        if (measurementTypeSelect.value === 'Perus') {
            mealTypeGroup.style.display = 'none';
        } else {
            mealTypeGroup.style.display = 'flex';
        }
    }
}

/**
 * Lisää info-napit verensokeri- ja terveysmetriikat-komponentteihin
 */
function setupComponentInfoButtons() {
    // Komponentit, joihin lisätään info-napit
    const components = [
        { 
            selector: '.dashboard-card:nth-child(2)', 
            title: 'Verensokeri-ohje',
            content: 'Tämä osio näyttää verensokeriarvosi valitulta päivältä. Voit tarkastella perusseurannan arvoja (aamu- ja ilta-arvot) tai ateriakohtaisia arvoja (ennen ja jälkeen).'
        },
        { 
            selector: '.metrics-container', 
            title: 'Terveysmetriikat-ohje',
            content: 'Tässä osiossa näet HRV-analyysistä lasketut terveysmetriikat: palautumisen, stressin, keskisykkeen ja fysiologisen iän.'
        }
    ];
    
    components.forEach(component => {
        const container = document.querySelector(component.selector);
        if (container) {
            // Luo info-nappi
            const infoButton = document.createElement('button');
            infoButton.className = 'info-button';
            infoButton.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
            infoButton.setAttribute('title', component.title);
            
            // Lisää tapahtumankäsittelijä
            infoButton.addEventListener('click', () => {
                alert(`${component.title}\n\n${component.content}`);
            });
            
            // Varmista että kontainerilla on position relative
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            
            // Lisää nappi kontaineriin
            container.appendChild(infoButton);
        }
    });
}