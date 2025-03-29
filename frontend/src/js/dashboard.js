document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard loading...");
    const logoutButton = document.getElementById('logoutButton');

    // Add event listener for logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // HUOM: Autentikointi on poistettu käytöstä kehitysvaiheen ajaksi
    // Alusta dashboard suoraan ilman autentikaatiota
    initializeDashboard();
});

// Function to initialize dashboard components
function initializeDashboard() {
    console.log("Initializing dashboard components...");
    // Initialize calendar
    initializeCalendar();

    // Initialize chart placeholder
    initializeChartPlaceholder();
}

// Calendar functionality
function initializeCalendar() {
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!monthYearElement || !datesElement || !prevBtn || !nextBtn) {
        console.error("Calendar elements not found!");
        return;
    }

    let currentDate = new Date();

    const updateCalendar = () => {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();

        // Adjust for Monday as first day of week (0 = Monday in our grid)
        let firstDayIndex = firstDay.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6; // Sunday becomes 6

        let lastDayIndex = lastDay.getDay() - 1;
        if (lastDayIndex === -1) lastDayIndex = 6;

        const monthYearString = currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });
        monthYearElement.textContent = monthYearString;

        let datesHTML = "";

        // Previous month days
        for (let i = firstDayIndex; i > 0; i--) {
            const prevDate = new Date(currentYear, currentMonth, 0 - i + 1);
            datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const today = new Date();

            // Check if date is today
            const isToday = date.getDate() === today.getDate() &&
                           date.getMonth() === today.getMonth() &&
                           date.getFullYear() === today.getFullYear();

            // Add notification for specific dates (for UI demo purposes)
            const hasNotification = [1, 2, 9, 13, 15].includes(i);

            const activeClass = isToday ? "active" : "";
            const notificationClass = hasNotification ? "has-notification" : "";

            datesHTML += `<div class="date ${activeClass} ${notificationClass}">${i}</div>`;
        }

        // Next month days
        for (let i = 1; i <= 7 - lastDayIndex - 1; i++) {
            const nextDate = new Date(currentYear, currentMonth + 1, i);
            datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;
        }

        datesElement.innerHTML = datesHTML;

        // Add click event listeners to dates
        document.querySelectorAll('.date:not(.inactive)').forEach(dateElement => {
            dateElement.addEventListener('click', () => {
                // Remove active class from all dates
                document.querySelectorAll('.date').forEach(el => {
                    el.classList.remove('active');
                });

                // Add active class to clicked date
                dateElement.classList.add('active');

                // This would trigger data loading for the selected date in a real implementation
            });
        });
    };

    prevBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar();
}

// Placeholder function to initialize chart (just for UI demo)
function initializeChartPlaceholder() {
    // Chartit piirretään nyt HTML:ssä SVG:nä, joten tätä funktiota ei tarvita tähän tarkoitukseen

    // Lisätään mittaustyypin vaihtologiikka
    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        // Lisätään tapahtumankäsittelijä mittaustyypin vaihdolle
        measurementTypeSelect.addEventListener('change', function() {
            if (this.value === 'Perus') {
                mealTypeGroup.style.display = 'none';
            } else {
                mealTypeGroup.style.display = 'flex';
            }
        });

        // Alustetaan näkyvyys nykyisen valinnan mukaan
        if (measurementTypeSelect.value === 'Perus') {
            mealTypeGroup.style.display = 'none';
        } else {
            mealTypeGroup.style.display = 'flex';
        }
    }
}

// Function to handle logout
function handleLogout() {
    // Pelkkä viesti konsoliin, ei todellista uloskirjautumista
    console.log('Logout clicked');

    // Kehitysversiossa ei vielä tehdä uloskirjautumista tai uudelleenohjausta
}
