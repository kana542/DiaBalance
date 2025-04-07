/**
 * auth.js
 * Kirjautumisen käsittely ES moduuleina
 */

import { login, getAuthToken } from '../utils/api-client.js';
import { showError } from '../utils/ui-utils.js';

/**
 * Alustus kun DOM on latautunut
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth module loaded');

    // Get the login form
    const loginForm = document.getElementById('loginForm');

    // Check if user is already logged in
    const token = getAuthToken();
    if (token) {
        console.log('User already logged in, redirecting to dashboard');
        window.location.href = 'dashboard.html';
        return;
    }

    // Add event listener for form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

/**
 * Käsittelee kirjautumislomakkeen lähettämisen
 * @param {Event} event - Lomakkeen lähetystapahtuma
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Basic validation
    if (!email || !password) {
        showError(errorMessage, 'Please enter both email/username and password');
        return;
    }

    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    try {
        // Login using API client
        await login(email, password);

        // Show success message
        alert('Kirjautuminen onnistui!');

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        alert('Yhteysvirhe palvelimeen tai väärät kirjautumistiedot. Yritä myöhemmin uudelleen.');
        showError(errorMessage, error.message || 'Kirjautuminen epäonnistui. Tarkista tunnukset.');
        resetButton(submitButton, originalButtonText);
    }
}

/**
 * Palauttaa napin alkuperäiseen tilaan
 * @param {HTMLElement} button - Nappi-elementti
 * @param {string} text - Alkuperäinen teksti
 */
function resetButton(button, text) {
    button.textContent = text;
    button.disabled = false;
}

// Vie funktiot, jotta niitä voidaan käyttää globaalisti
export {
    handleLogin
};
