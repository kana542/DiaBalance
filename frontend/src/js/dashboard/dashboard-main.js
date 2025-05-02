import { getAuthToken, clearAuthToken, logout, getLoggedInUser } from '../utils/api-client.js';
import { showToast } from '../utils/ui-utils.js';
import { initializeCalendar } from './calendar-module.js';
import { initializeEntryModule } from './entry-module.js';
import { initializeChartView } from './chart-module.js';
import { initializeHRVModule } from './hrv-module.js';
import { initializeModalModule } from './modal-module.js';
import { setupInfoButtons } from './info-module.js';

window.DiaBalance = {
    calendar: {},
    entries: {
        monthEntries: {}
    },
    charts: {},
    hrv: {},
    modal: {}
};

document.addEventListener('DOMContentLoaded', () => {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

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

    initializeUI();
});

function initializeUI() {
    updateUserInfo();

    setupLogoutButton();

    initializeEntryModule();
    initializeCalendar();
    initializeChartView();
    initializeHRVModule();
    initializeModalModule();

    setupInfoButtons();

    const user = getLoggedInUser();
    if (user && user.username) {
        showToast(`Tervetuloa, ${user.username}!`, 'info');
    }
}

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

function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

async function handleLogout() {
    console.log('Logout button clicked in dashboard');

    try {
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

        clearAuthToken();

        showToast('Kirjauduttu ulos onnistuneesti', 'success');

        window.location.href = '../../index.html';
    } catch (error) {
        console.error('Logout error:', error);

        clearAuthToken();
        showToast('Kirjauduttu ulos (paikallisesti)', 'warning');
        window.location.href = '../../index.html';
    }
}

export {
    updateUserInfo,
    handleLogout
};
