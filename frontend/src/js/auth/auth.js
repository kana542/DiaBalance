import { login, getAuthToken } from '../utils/api-client.js';
import { showError, NotificationSeverity, showToast } from '../utils/ui-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth module loaded');

    // Hae kirjautumislomake
    const loginForm = document.getElementById('loginForm');

    // Tarkista onko käyttäjä jo kirjautunut
    const token = getAuthToken();
    if (token) {
        console.log('Käyttäjä on jo kirjautunut, uudelleenohjataan dashboardiin');
        window.location.href = 'dashboard.html';
        return;
    }

    // Lisää tapahtumankäsittelijä lomakkeen lähetykseen
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Perusvalidointi
    if (!email || !password) {
        showError(errorMessage, 'Syötä sekä käyttäjätunnus/sähköposti että salasana');
        return;
    }

    // Näytä latauksen tila
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Kirjaudutaan...';
    submitButton.disabled = true;

    try {
        // Kirjaudu API-clientin avulla
        await login(email, password);
        
        // Pieni viive jotta ilmoitus ehtii näkyä
        setTimeout(() => {
            // Uudelleenohjaa dashboardiin
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        console.error('Kirjautumisvirhe:', error);
        showError(errorMessage, error.message || 'Kirjautuminen epäonnistui. Tarkista tunnukset.');
        resetButton(submitButton, originalButtonText);
    }
}

function resetButton(button, text) {
    button.textContent = text;
    button.disabled = false;
}

export {
    handleLogin
};