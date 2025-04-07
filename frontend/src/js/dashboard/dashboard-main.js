/**
 * dashboard-main.js
 * Dashboard-sovelluksen päämoduuli, joka alustaa kaikki komponentit
 */

import { getAuthToken, clearAuthToken, getLoggedInUser } from '../utils/api-client.js';
import { showToast } from '../utils/ui-utils.js';
import { initializeCalendar } from './calendar-module.js';
import { initializeEntryModule } from './entry-module.js';
import { initializeChartView } from './chart-module.js';
import { initializeHRVModule } from './hrv-module.js';
import { initializeModalModule } from './modal-module.js';
import { setupInfoButtons } from './info-module.js';

// Globaali nimiavaruus
window.DiaBalance = {
    calendar: {},
    entries: {
        monthEntries: {}
    },
    charts: {},
    hrv: {},
    modal: {}
};

/**
 * Sovelluksen alustus
 */
document.addEventListener('DOMContentLoaded', () => {
    // Tarkista onko käyttäjä kirjautunut
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Kiinnitä modulit globaaliin nimiavaruuteen
    // Tämä on vain yhteensopivuutta varten, uuden koodin pitäisi käyttää importteja
    import('./calendar-module.js').then(module => {
        window.DiaBalance.calendar = module;
    });

    import('./entry-module.js').then(module => {
        window.DiaBalance.entries = module;
    });

    import('./chart-module.js').then(module => {
        window.DiaBalance.charts = module;
    });

    import('./hrv-module.js').then(module => {
        window.DiaBalance.hrv = module;
    });

    import('./modal-module.js').then(module => {
        window.DiaBalance.modal = module;
    });

    // Alusta käyttöliittymä
    initializeUI();
});

/**
 * Alusta käyttöliittymä
 */
function initializeUI() {
    // Päivitä käyttäjätiedot
    updateUserInfo();

    // Aseta uloskirjautumisnappi
    setupLogoutButton();

    // Alusta moduulit
    initializeEntryModule();
    initializeCalendar();
    initializeChartView();
    initializeHRVModule();
    initializeModalModule();

    // Aseta info-napit
    setupInfoButtons();

    // Näytä tervetuloviesti
    const user = getLoggedInUser();
    if (user && user.username) {
        showToast(`Tervetuloa, ${user.username}!`, 'info');
    }
}

/**
 * Päivitä käyttäjätiedot näkymässä
 */
function updateUserInfo() {
    try {
        const user = getLoggedInUser();
        if (user) {
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
 * Aseta uloskirjautumisnapin tapahtumankäsittelijä
 */
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

/**
 * Käsittele uloskirjautuminen
 */
function handleLogout() {
    clearAuthToken();
    showToast('Kirjauduttu ulos onnistuneesti', 'success');
    window.location.href = '../../index.html';
}

// Vie funktiot, jotta niitä voidaan käyttää globaalisti
export {
    updateUserInfo,
    handleLogout
};
