/**
 * main.js
 * Etusivun toiminnallisuus
 */

import { getAuthToken } from './js/utils/api-client.js';

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
    // Poista token localStorage:sta
    localStorage.removeItem('token');
    localStorage.removeItem('user');

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
}

// Vie funktiot, jotta niitä voidaan käyttää globaalisti
export {
    checkAuthAndUpdateUI,
    handleLogout
};
