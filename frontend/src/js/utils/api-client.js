/**
 * api-client.js
 * API-pyyntöjen käsittelijä, joka huolehtii autentikoinnista ja virhekäsittelystä
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Tarkistaa onko käyttäjällä voimassaoleva token
 * @returns {string|null} - Token tai null jos ei kirjautunut
 */
export function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Poistaa autentikaatiotiedot localStoragesta
 */
export function clearAuthToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/**
 * Hakee kirjautuneen käyttäjän tiedot
 * @returns {Object|null} - Käyttäjän tiedot tai null
 */
export function getLoggedInUser() {
    try {
        const userString = localStorage.getItem('user');
        if (userString) {
            return JSON.parse(userString);
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
    }
    return null;
}

/**
 * Tekee autentikoidun API-kutsun
 * @param {string} endpoint - API-endpoint (ilman base URL:ia)
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Promise joka resolvautuu vastauksen kanssa
 * @throws {Error} - Virhe jos autentikaatiota ei ole tai pyyntö epäonnistuu
 */
export async function fetchWithAuth(endpoint, options = {}) {
    const token = getAuthToken();

    if (!token) {
        throw new Error('Ei kirjautumistietoja');
    }

    // Lisää autentikointi header
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    // Muodosta täydellinen URL
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Sending ${options.method || 'GET'} request to: ${url}`);

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Tarkistetaan HTTP-virheet
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP-virhe: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error(`API-kutsu epäonnistui: ${endpoint}`, error);
        throw error;
    }
}

/**
 * Hakee tietoa API:sta
 * @param {string} endpoint - API-endpoint
 * @returns {Promise<any>} - Promise joka resolvautuu vastauksella
 */
export async function apiGet(endpoint) {
    const response = await fetchWithAuth(endpoint);
    return response.json();
}

/**
 * Lähettää tietoa API:in
 * @param {string} endpoint - API-endpoint
 * @param {Object} data - Lähetettävä data
 * @returns {Promise<any>} - Promise joka resolvautuu vastauksella
 */
export async function apiPost(endpoint, data) {
    const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Päivittää tietoa API:ssa
 * @param {string} endpoint - API-endpoint
 * @param {Object} data - Päivitettävä data
 * @returns {Promise<any>} - Promise joka resolvautuu vastauksella
 */
export async function apiPut(endpoint, data) {
    const response = await fetchWithAuth(endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Poistaa tietoa API:sta
 * @param {string} endpoint - API-endpoint
 * @returns {Promise<any>} - Promise joka resolvautuu vastauksella
 */
export async function apiDelete(endpoint) {
    const response = await fetchWithAuth(endpoint, {
        method: 'DELETE'
    });
    return response.json();
}

/**
 * Kirjaa käyttäjän sisään
 * @param {string} username - Käyttäjänimi
 * @param {string} password - Salasana
 * @returns {Promise<Object>} - Kirjautumistiedot
 */
export async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kayttajanimi: username,
                salasana: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kirjautuminen epäonnistui');
        }

        // Tallenna token ja käyttäjätiedot
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.user.kayttaja_id,
            username: data.user.kayttajanimi,
            role: data.user.kayttajarooli
        }));

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Rekisteröi uuden käyttäjän
 * @param {string} username - Käyttäjänimi
 * @param {string} password - Salasana
 * @param {string} email - Sähköposti (valinnainen)
 * @returns {Promise<Object>} - Rekisteröintitiedot
 */
export async function register(username, password, email = null) {
    try {
        const userData = {
            kayttajanimi: username,
            salasana: password
        };

        if (email) {
            userData.email = email;
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Rekisteröinti epäonnistui');
        }

        return data;
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
}
