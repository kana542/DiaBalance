/**
 * main.js
 * Etusivun toiminnallisuus
 */

import { getAuthToken, clearAuthToken, logout } from './js/utils/api-client.js';

/**
 * Alustus kun DOM on latautunut
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main page loaded');

    // Tarkista kirjautuminen ja päivitä napit sen mukaan
    checkAuthAndUpdateUI();

    // Lisää tapahtumankäsittelijät
    setupEventListeners();
});

/**
 * Tarkistaa kirjautumistilan ja päivittää käyttöliittymän sen mukaan
 */
function checkAuthAndUpdateUI() {
    const token = getAuthToken();
    const isLoggedIn = !!token;

    const authButton = document.getElementById('authButton');

    if (authButton) {
        if (isLoggedIn) {
            // Käyttäjä on kirjautunut - näytä uloskirjautumisnappi
            authButton.textContent = 'Logout';
            authButton.addEventListener('click', handleLogout);
        } else {
            // Käyttäjä ei ole kirjautunut - näytä kirjautumisnappi
            authButton.textContent = 'Login';
            authButton.addEventListener('click', () => {
                window.location.href = './src/pages/login.html';
            });
        }
    }
}

/**
 * Lisää sivun tapahtumankäsittelijät
 */
function setupEventListeners() {
    // Tässä voidaan lisätä muita etusivun tapahtumankäsittelijöitä
}

/**
 * Käsittelee uloskirjautumisen
 */
function handleLogout() {
    console.log('Logout button clicked');

    // Poista token ja käyttäjätiedot localStoragesta välittömästi
    clearAuthToken();

    // Päivitä nappi ja sen toiminto ilman että sivu päivittyy kokonaan
    const authButton = document.getElementById('authButton');
    authButton.textContent = 'Login';

    // Poista edellinen event listener ja lisää uusi
    authButton.removeEventListener('click', handleLogout);
    authButton.addEventListener('click', () => {
        window.location.href = './src/pages/login.html';
    });

    // Näytä viesti
    alert('You have been logged out successfully.');

    // Lähetä logout-pyyntö palvelimelle taustalla
    logout().catch(error => {
        console.error('Server-side logout error:', error);
        // Käyttäjä on jo kirjautunut ulos, joten ei tarvita toimenpiteitä
    });
}

// Vie funktiot, jotta niitä voidaan käyttää globaalisti
export {
    checkAuthAndUpdateUI,
    handleLogout
};
