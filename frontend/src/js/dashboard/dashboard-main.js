// Tuodaan tarvittavat toiminnallisuudet muista moduuleista
import { getAuthToken, clearAuthToken, logout, getLoggedInUser } from '../utils/api-client.js';
import { showToast } from '../utils/ui-utils.js';
import { initializeCalendar } from './calendar-module.js';
import { initializeEntryModule } from './entry-module.js';
import { initializeChartView } from './chart-module.js';
import { initializeHRVModule } from './hrv-module.js';
import { initializeModalModule } from './modal-module.js';
import { setupInfoButtons } from './info-module.js';

// Luodaan globaali DiaBalance-nimialue sovelluksen moduulien jakamiseen
window.DiaBalance = {
    calendar: {},
    entries: {
        monthEntries: {}
    },
    charts: {},
    hrv: {},
    modal: {}
};

// Alustetaan sovellus, kun DOM on latautunut
document.addEventListener('DOMContentLoaded', () => {
    // Tarkistetaan onko käyttäjä kirjautunut
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Ladataan dynaamisesti eri moduulit ja lisätään ne globaaliin DiaBalance-objektiin
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

    // Alustetaan käyttöliittymä
    initializeUI();
});

// Käyttöliittymän alustaminen
function initializeUI() {
    // Päivitetään käyttäjätiedot näkymään
    updateUserInfo();

    // Asetetaan uloskirjautumisnapin toiminnallisuus
    setupLogoutButton();

    // Alustetaan kaikki sovelluksen moduulit
    initializeEntryModule();
    initializeCalendar();
    initializeChartView();
    initializeHRVModule();
    initializeModalModule();

    // Alustetaan info-napit
    setupInfoButtons();

    // Näytetään tervetuloviesti kirjautuneelle käyttäjälle
    const user = getLoggedInUser();
    if (user && user.username) {
        showToast(`Tervetuloa, ${user.username}!`, 'info');
    }
}

// Päivittää käyttäjän tiedot käyttöliittymään
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

// Asettaa uloskirjautumisnapin toiminnallisuuden
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

// Käsittelee uloskirjautumisen
async function handleLogout() {
    console.log('Logout button clicked in dashboard');

    try {
        // Lähetetään uloskirjautumispyyntö palvelimelle
        console.log('Sending logout request to server...');
        const response = await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Server logout response:', data);

        // Poistetaan autentikointitiedot
        clearAuthToken();

        // Näytetään ilmoitus onnistuneesta uloskirjautumisesta
        showToast('Kirjauduttu ulos onnistuneesti', 'success');

        // Ohjataan käyttäjä etusivulle
        window.location.href = '../../index.html';
    } catch (error) {
        console.error('Logout error:', error);

        // Varmistetaan uloskirjautuminen vaikka palvelinpyyntö epäonnistuisi
        clearAuthToken();
        showToast('Kirjauduttu ulos (paikallisesti)', 'warning');
        window.location.href = '../../index.html';
    }
}

// Viedään tarvittavat funktiot moduulista
export {
    updateUserInfo,
    handleLogout
};