/**
 * Authentication check for protected pages
 * This file should be included in dashboard.html and other protected pages
 */

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
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Ei tokenia, ohjaa kirjautumissivulle
        console.log('No authentication token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Authentication token found, proceeding to dashboard');
    
    // Alusta dashboard (viittaus dashboard.js tiedostoon)
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
})();

/**
 * Helper function for making authenticated API requests
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token available');
    }
    
    // Kehitystilassa voidaan simuloida API-kutsuja
    if (token === 'dev-token-123') {
        console.log('DEV MODE: Would make API call to', url);
        // Tässä voidaan lisätä simuloitu API-vastaus tarvittaessa
        return new Promise(resolve => {
            resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
                text: () => Promise.resolve('{}')
            });
        });
    }
    
    // Lisää autentikointi header
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    // Tee autentikoitu pyyntö
    return fetch(url, {
        ...options,
        headers
    });
}