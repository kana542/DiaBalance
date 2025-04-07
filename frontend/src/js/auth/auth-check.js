/**
 * auth-check.js
 * Tarkistaa käyttäjän kirjautumistilan suojatuilla sivuilla
 */

import { getAuthToken } from './utils/api-client.js';

// Suorita autentikoinnin tarkistus heti, mutta vain kerran
(function() {
    console.log('Auth check initializing...');

    // Tarkistaa onko autentikointi jo suoritettu tällä sivulatauksella
    if (window.authCheckComplete) {
        console.log('Auth check already completed for this page load');
        return;
    }

    // Merkitse autentikointi suoritetuksi
    window.authCheckComplete = true;

    // Tarkista, onko token olemassa
    const token = getAuthToken();

    if (!token) {
        // Ei tokenia, ohjaa kirjautumissivulle
        console.log('No authentication token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    console.log('Authentication token found, proceeding to dashboard');
})();

// Export tyhjän objektin yhteensopivuuden vuoksi, koska moduuli suorittaa
// tarkistuksen automaattisesti kun se ladataan
export default {};
