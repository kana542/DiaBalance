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
    
    console.log("Authentication status:", isLoggedIn ? "Logged in" : "Not logged in");

    // 1. Päivitä auth-nappi oikeassa yläkulmassa
    const authButton = document.getElementById('authButton');
    if (authButton) {
        if (isLoggedIn) {
            // Käyttäjä on kirjautunut - näytä uloskirjautumisnappi
            authButton.textContent = 'Logout';
            authButton.addEventListener('click', handleLogout);
            console.log("Auth button set to Logout");
        } else {
            // Käyttäjä ei ole kirjautunut - näytä kirjautumisnappi
            authButton.textContent = 'Login';
            authButton.addEventListener('click', () => {
                window.location.href = './src/pages/login.html';
            });
            console.log("Auth button set to Login");
        }
    }
    
    // 2. Päivitä navigaatiopalkin teksti kirjautumiselle/rekisteröitymiselle
    const navAuthLink = document.querySelector('.nav-links a[href*="login.html"]');
    if (navAuthLink) {
        if (isLoggedIn) {
            navAuthLink.textContent = 'PALAA YLEISNÄKYMÄÄN';
            navAuthLink.href = './src/pages/dashboard.html';
            console.log("Navigation link updated to: PALAA YLEISNÄKYMÄÄN");
        } else {
            navAuthLink.textContent = 'KIRJAUDU / REKISTERÖIDY';
            navAuthLink.href = './src/pages/login.html';
            console.log("Navigation link set to: KIRJAUDU / REKISTERÖIDY");
        }
    } else {
        console.warn("Navigation auth link not found");
    }
    
    // 3. Piilota/näytä kirjautumisnappi sisältöalueella
    const loginCTA = document.querySelector('.text-content .cta-button');
    if (loginCTA) {
        if (isLoggedIn) {
            loginCTA.style.display = 'none';
            console.log("Login CTA button hidden");
        } else {
            loginCTA.style.display = 'inline-block';
            console.log("Login CTA button visible");
        }
    } else {
        console.warn("Login CTA button not found");
    }
}

/**
 * Lisää sivun tapahtumankäsittelijät
 */
function setupEventListeners() {
    // Varmista että auth-tilan muutokset päivittävät käyttöliittymän
    window.addEventListener('storage', (event) => {
        if (event.key === 'token') {
            console.log("Token changed in localStorage, updating UI");
            checkAuthAndUpdateUI();
        }
    });
    
    // Manuaalinen trigger käyttöliittymän päivitykselle - varmistus
    setTimeout(() => {
        console.log("Running delayed UI update check");
        checkAuthAndUpdateUI();
    }, 500);
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
    if (authButton) {
        authButton.textContent = 'Login';

        // Poista edellinen event listener ja lisää uusi
        authButton.removeEventListener('click', handleLogout);
        authButton.addEventListener('click', () => {
            window.location.href = './src/pages/login.html';
        });
    }
    
    // Päivitä kaikki muut UI-elementit
    checkAuthAndUpdateUI();

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