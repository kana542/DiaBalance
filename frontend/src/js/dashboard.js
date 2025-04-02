/**
 * DiaBalance Dashboard
 * Handles dashboard functionality, component initialization, and API integration
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard DOM loaded");
    
    // Set up logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Näytetään käyttäjänimi - tehdään tämä vain kerran 
    updateUserInfo();
    
    // Alusta dashboard jos sitä ei ole vielä alustettu
    if (!window.dashboardInitialized) {
        initializeDashboard();
    }
});

/**
 * Initialize all dashboard components after successful authentication
 * This function is called by auth-check.js after token validation
 */
function initializeDashboard() {
    // Varmistetaan että dashboard alustetaan vain kerran
    if (window.dashboardInitialized) {
        console.log("Dashboard already initialized");
        return;
    }
    
    console.log("Initializing dashboard components...");
    window.dashboardInitialized = true;
    
    // Initialize calendar component
    initializeCalendar();
    
    // Initialize chart view
    initializeChartView();
    
    // Initialize blood glucose values component
    initializeBloodGlucoseView();
    
    // Initialize HRV analysis component
    initializeHrvAnalysis();
    
    // Setup info buttons
    setupInfoButtons();
}

/**
 * Handle user logout
 */
function handleLogout() {
    console.log('Logging out...');
    
    // Remove auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show success message
    alert('Kirjauduttu ulos onnistuneesti.');
    
    // Redirect to home page
    window.location.href = '../../index.html';
}

/**
 * Update user information in the UI
 */
function updateUserInfo() {
    try {
        const userString = localStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            
            // Update username in header
            const usernameElement = document.getElementById('username');
            if (usernameElement && user.username) {
                usernameElement.textContent = user.username;
            }
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

/**
 * Initialize calendar component
 */
function initializeCalendar() {
    console.log("Initializing calendar");
    
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!monthYearElement || !datesElement || !prevBtn || !nextBtn) {
        console.error("Calendar elements not found!");
        return;
    }

    let currentDate = new Date();

    // Function to render the calendar
    const updateCalendar = async () => {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();

        // Adjust week to start from Monday (0 = Monday in our grid)
        let firstDayIndex = firstDay.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6; // Sunday becomes 6

        let lastDayIndex = lastDay.getDay() - 1;
        if (lastDayIndex === -1) lastDayIndex = 6;

        // Set month and year text
        const monthYearString = currentDate.toLocaleString("fi-FI", {
            month: "long",
            year: "numeric",
        });
        monthYearElement.textContent = monthYearString;

        // Placeholder for fetching entries for the current month
        // This will be implemented when backend is available
        
        // For now, use example entries to show functionality
        const exampleEntries = [
            { date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-05`, isComplete: true },
            { date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-10`, isComplete: false },
            { date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-15`, isComplete: true },
            { date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-20`, isComplete: false }
        ];
        
        // Create a map of dates with entries
        const entriesMap = new Map();
        exampleEntries.forEach(entry => {
            // Parse the entry date and get the day
            const entryDate = new Date(entry.date);
            if (entryDate.getMonth() === currentMonth && 
                entryDate.getFullYear() === currentYear) {
                entriesMap.set(entryDate.getDate(), {
                    isComplete: entry.isComplete
                });
            }
        });

        let datesHTML = "";

        // Previous month's days
        for (let i = firstDayIndex; i > 0; i--) {
            const prevDate = new Date(currentYear, currentMonth, 0 - i + 1);
            datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
        }

        // Current month's days
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const today = new Date();

            // Check if this date is today
            const isToday = date.getDate() === today.getDate() &&
                           date.getMonth() === today.getMonth() &&
                           date.getFullYear() === today.getFullYear();

            // Check if the date has an entry
            const hasEntry = entriesMap.has(i);
            
            // Define CSS classes based on entry status
            let entryClass = '';
            if (hasEntry) {
                const entry = entriesMap.get(i);
                entryClass = entry.isComplete ? 'has-complete-entry' : 'has-partial-entry';
            }
            
            const activeClass = isToday ? "active" : "";

            datesHTML += `<div class="date ${activeClass} ${entryClass}" data-date="${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}">${i}</div>`;
        }

        // Next month's days
        for (let i = 1; i <= 7 - lastDayIndex - 1; i++) {
            const nextDate = new Date(currentYear, currentMonth + 1, i);
            datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;
        }

        datesElement.innerHTML = datesHTML;

        // Add click handlers to date elements
        setupDateClickHandlers();
    };

    // Set up date click handlers
    function setupDateClickHandlers() {
        document.querySelectorAll('.date:not(.inactive)').forEach(dateElement => {
            // Single click selects the date
            dateElement.addEventListener('click', (e) => {
                // Remove active class from all dates
                document.querySelectorAll('.date').forEach(el => {
                    el.classList.remove('active');
                });

                // Add active class to clicked date
                dateElement.classList.add('active');
                
                // Get the selected date
                const dateStr = dateElement.getAttribute('data-date');
                console.log(`Selected date: ${dateStr}`);
                
                // Here we would load data for the selected date
                // This will be implemented when backend is available
            });
            
            // Double click opens entry modal
            dateElement.addEventListener('dblclick', (e) => {
                const dateStr = dateElement.getAttribute('data-date');
                console.log(`Double-clicked date: ${dateStr} - would open modal`);
                
                // Prevent the click event from firing
                e.stopPropagation();
                
                // Here we would open entry modal
                alert(`Tässä aukeaisi modaali merkinnän lisäämiseksi/muokkaamiseksi päivälle ${dateStr}`);
            });
        });
    }

    // Add event listeners to previous/next buttons
    prevBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });
    
    // Initial calendar render
    updateCalendar();
}

/**
 * Initialize chart view component
 */
function initializeChartView() {
    console.log("Initializing chart view");
    
    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        // Add event listener for measurement type change
        measurementTypeSelect.addEventListener('change', function() {
            if (this.value === 'Perus') {
                mealTypeGroup.style.display = 'none';
            } else {
                mealTypeGroup.style.display = 'flex';
            }
        });
        
        // Initialize meal type selector
        const mealTypeSelect = document.getElementById('mealType');
        if (mealTypeSelect) {
            mealTypeSelect.addEventListener('change', function() {
                // Chart update would happen here when backend is ready
                console.log("Meal type changed:", this.value);
            });
        }

        // Initialize based on current selection
        if (measurementTypeSelect.value === 'Perus') {
            mealTypeGroup.style.display = 'none';
        } else {
            mealTypeGroup.style.display = 'flex';
        }
    }
}

/**
 * Initialize blood glucose values component
 */
function initializeBloodGlucoseView() {
    console.log("Initializing blood glucose view");
    // This will be implemented in future tasks
}

/**
 * Initialize HRV analysis component
 */
function initializeHrvAnalysis() {
    console.log("Initializing HRV analysis");
    // This will be implemented in future tasks
}

/**
 * Setup info buttons for all components
 */
function setupInfoButtons() {
    console.log("Setting up info buttons");
    
    // Define info content for each component
    const infoContent = {
        calendar: {
            title: "Kalenterin käyttö",
            content: "Kalenteri näyttää kaikki kuukauden päivät. Punaisella merkityt päivät sisältävät valmiit merkinnät, oranssilla merkityt osittaiset merkinnät. Klikkaa päivämäärää nähdäksesi sen päivän tiedot. Tuplaklikkaa päivämäärää lisätäksesi tai muokataksesi merkintää."
        },
        bloodSugar: {
            title: "Verensokeriseuranta",
            content: "Tämä osio näyttää verensokeriarvosi valitulta päivältä. Voit tarkastella perusseurannan arvoja (aamu- ja ilta-arvot) tai ateriakohtaisia arvoja (ennen ja jälkeen)."
        },
        chart: {
            title: "Kaaviotieto",
            content: "Kaavio näyttää verensokeriarvojen kehityksen kuukauden ajalta. Voit valita näytettäväksi perusseurannan tai ateriakohtaiset arvot. Punaiset pisteet ovat mittauksia ennen ateriaa, turkoosin väriset mittauksia aterian jälkeen."
        },
        hrv: {
            title: "HRV-analyysi",
            content: "Tämä osio näyttää ladatun HRV-datan analyysin tulokset: palautumisen, stressin, keskisykkeen ja fysiologisen iän. Lataa HRV-data päiväkirjamerkinnän kautta."
        }
    };
    
    // Setup info button event listeners
    const infoButtons = {
        calendar: document.getElementById('calendarInfoBtn'),
        bloodSugar: document.getElementById('bloodSugarInfoBtn'),
        chart: document.getElementById('chartInfoBtn'),
        hrv: document.getElementById('hrvInfoBtn')
    };
    
    // Add click event listeners to each info button
    for (const [key, button] of Object.entries(infoButtons)) {
        if (button) {
            button.addEventListener('click', () => {
                const info = infoContent[key];
                alert(`${info.title}\n\n${info.content}`);
            });
        } else {
            console.error(`Info button for ${key} not found`);
        }
    }
}