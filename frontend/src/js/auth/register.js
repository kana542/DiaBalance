/**
 * register.js
 * Rekisteröintilogiikka ES moduuleina
 */

import { register, getAuthToken } from '../utils/api-client.js';
import { showError } from '../utils/ui-utils.js';

/**
 * Alustus kun DOM on latautunut
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Rekisteröintisivu ladattu');

    // Haetaan rekisteröintilomake
    const registerForm = document.getElementById('registerForm');

    // Tarkistetaan onko käyttäjä jo kirjautunut
    const token = getAuthToken();
    if (token) {
        // Jos käyttäjä on jo kirjautunut, ohjataan dashboard-sivulle
        window.location.href = 'dashboard.html';
        return;
    }

    // Lisätään lomakkeen lähetystapahtumankäsittelijä
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Lisätään kenttien validointi
    setupFormValidation();
});

/**
 * Käsittelee rekisteröintilomakkeen lähetyksen
 * @param {Event} event - Lomakkeen lähetystapahtuma
 */
async function handleRegister(event) {
    event.preventDefault();

    // Haetaan lomakkeen tiedot
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    // Nollataan virheilmoitukset
    errorMessage.style.display = 'none';

    // Perusvalidointi
    if (!username || !password) {
        showError(errorMessage, 'Täytä kaikki pakolliset kentät');
        return;
    }

    if (password !== confirmPassword) {
        showError(errorMessage, 'Salasanat eivät täsmää');
        return;
    }

    if (password.length < 8) {
        showError(errorMessage, 'Salasanan tulee olla vähintään 8 merkkiä pitkä');
        return;
    }

    // Näytetään latausilmaisin
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Luodaan tiliä...';
    submitButton.disabled = true;

    try {
        // Käytä API-clientia rekisteröintiin
        await register(username, password, email);

        // Display success message with alert
        alert('Rekisteröinti onnistui! Voit nyt kirjautua sisään uudella tililläsi.');

        // Redirect to login page
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Rekisteröintivirhe:', error);
        alert('Yhteysvirhe palvelimeen. Yritä myöhemmin uudelleen.');
        showError(errorMessage, error.message || 'Rekisteröinti epäonnistui. Yritä uudelleen.');
        resetButton(submitButton, originalButtonText);
    }
}

/**
 * Asettaa lomakkeen kenttien validoinnin
 */
function setupFormValidation() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordRequirements = document.querySelector('.password-requirements');

    if (passwordInput && confirmPasswordInput) {
        // Tarkistetaan salasanojen täsmäävyys kirjoitettaessa
        confirmPasswordInput.addEventListener('input', () => {
            if (passwordInput.value && confirmPasswordInput.value) {
                if (passwordInput.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.style.borderColor = '#e74c3c';
                } else {
                    confirmPasswordInput.style.borderColor = '#4b6cb7';
                }
            }
        });

        // Tarkistetaan salasanan pituus kirjoitettaessa
        passwordInput.addEventListener('input', () => {
            if (passwordRequirements) {
                if (passwordInput.value.length > 0 && passwordInput.value.length < 8) {
                    passwordRequirements.style.color = '#e74c3c';
                } else if (passwordInput.value.length >= 8) {
                    passwordRequirements.style.color = '#2ecc71';
                } else {
                    passwordRequirements.style.color = '#777';
                }
            }
        });
    }

    // Perus sähköpostiosoitteen validointi
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput.value && !emailRegex.test(emailInput.value)) {
                emailInput.style.borderColor = '#e74c3c';
            } else if (emailInput.value) {
                emailInput.style.borderColor = '#4b6cb7';
            }
        });
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
    handleRegister,
    setupFormValidation
};
