// api-client.js
import { showToast, NotificationSeverity, showValidationErrors } from './ui-utils.js';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Hakee autentikaatiotokenin paikallisesta tallennustilasta
 * @returns {string|null} JWT token tai null
 */
export function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Poistaa autentikaatiotokenin paikallisesta tallennustilasta
 */
export function clearAuthToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/**
 * Hakee kirjautuneen käyttäjän tiedot
 * @returns {Object|null} Käyttäjän tiedot tai null
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
 * Suorittaa API-kutsun autentikaatiolla
 * @param {string} endpoint - API-pääte
 * @param {Object} options - Kutsun asetukset
 * @returns {Promise<Response>} Fetch-vastaus
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

            // Käsitellään standardoitu virherakenne
            if (errorData.errors) {
                showValidationErrors(errorData.errors);
            }

            throw new Error(errorData.message || `HTTP-virhe: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error(`API-kutsu epäonnistui: ${endpoint}`, error);
        throw error;
    }
}

/**
 * Käsittelee API-vastauksen ja näyttää ilmoituksen
 * @param {Object} data - API-vastaus
 * @param {boolean} showMessages - Näytetäänkö ilmoitus
 * @returns {Object} Käsitelty data
 */
export function handleApiResponse(data, showMessages = true) {
    if (data.success === false && data.errors) {
        showValidationErrors(data.errors);
    }

    if (showMessages && data.message) {
        showToast(data.message, data.severity ||
            (data.success ? NotificationSeverity.SUCCESS : NotificationSeverity.ERROR));
    }

    return data.data || data;
}

/**
 * Suorittaa GET-kutsun
 * @param {string} endpoint - API-pääte
 * @param {boolean} showMessages - Näytetäänkö ilmoitukset
 * @returns {Promise<Object>} Vastauksen data
 */
export async function apiGet(endpoint, showMessages = true) {
    const response = await fetchWithAuth(endpoint);
    const data = await response.json();
    return handleApiResponse(data, showMessages);
}

/**
 * Suorittaa POST-kutsun
 * @param {string} endpoint - API-pääte
 * @param {Object} data - Lähetettävä data
 * @param {boolean} showMessages - Näytetäänkö ilmoitukset
 * @returns {Promise<Object>} Vastauksen data
 */
export async function apiPost(endpoint, data, showMessages = true) {
    const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const responseData = await response.json();
    return handleApiResponse(responseData, showMessages);
}

/**
 * Suorittaa PUT-kutsun
 * @param {string} endpoint - API-pääte
 * @param {Object} data - Lähetettävä data
 * @param {boolean} showMessages - Näytetäänkö ilmoitukset
 * @returns {Promise<Object>} Vastauksen data
 */
export async function apiPut(endpoint, data, showMessages = true) {
    const response = await fetchWithAuth(endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const responseData = await response.json();
    return handleApiResponse(responseData, showMessages);
}

/**
 * Suorittaa DELETE-kutsun
 * @param {string} endpoint - API-pääte
 * @param {boolean} showMessages - Näytetäänkö ilmoitukset
 * @returns {Promise<Object>} Vastauksen data
 */
export async function apiDelete(endpoint, showMessages = true) {
    const response = await fetchWithAuth(endpoint, {
        method: 'DELETE'
    });
    const data = await response.json();
    return handleApiResponse(data, showMessages);
}

/**
 * Kirjautuu sisään
 * @param {string} username - Käyttäjänimi tai sähköposti
 * @param {string} password - Salasana
 * @returns {Promise<Object>} Kirjautumistiedot
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

        if (!data.success) {
            if (data.errors) {
                showValidationErrors(data.errors);
            }
            throw new Error(data.message || 'Kirjautuminen epäonnistui');
        }

        // Käsitellään standardoitu vastausmuoto
        const userData = data.data || data;

        // Tallenna token ja käyttäjätiedot
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify({
            id: userData.user.kayttaja_id,
            username: userData.user.kayttajanimi,
            role: userData.user.kayttajarooli
        }));

        // Näytä kirjautumisilmoitus
        showToast(data.message || 'Kirjautuminen onnistui',
                  data.severity || NotificationSeverity.SUCCESS);

        // Log Kubios login status
        if (userData.kubios) {
            console.log('Kubios login status:', userData.kubios.success ? 'Success' : 'Failed');
            if (userData.kubios.message) {
                console.log('Kubios message:', userData.kubios.message);
            }
        }

        return userData;
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Kirjautuminen epäonnistui', NotificationSeverity.ERROR);
        throw error;
    }
}

/**
 * Kirjautuu ulos
 * @returns {Promise<Object>} Uloskirjautumisen tulos
 */
export async function logout() {
    try {
        const token = getAuthToken();

        if (!token) {
            console.log('No authentication token found, already logged out');
            clearAuthToken();
            return { success: true, message: 'Uloskirjautuminen onnistui' };
        }

        console.log('Sending logout request to server with token');

        // Poista token ja käyttäjätiedot localStoragesta
        const savedToken = token; // Tallenna token muuttujaan ennen poistoa
        clearAuthToken();

        // Lähetä uloskirjautumispyyntö palvelimelle käyttäen tallennettua tokenia
        try {
            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${savedToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Server-side logout successful:', data);

                if (data.message) {
                    showToast(data.message, data.severity || NotificationSeverity.SUCCESS);
                }

                return data;
            } else {
                console.warn('Server-side logout failed:', response.status);
                showToast('Uloskirjautuminen onnistui (paikallisesti)', NotificationSeverity.WARNING);
                return { success: true, message: 'Uloskirjautuminen onnistui (paikallisesti)' };
            }
        } catch (fetchError) {
            console.error('Error during server logout request:', fetchError);
            showToast('Uloskirjautuminen onnistui (paikallisesti)', NotificationSeverity.WARNING);
            return { success: true, message: 'Uloskirjautuminen onnistui (paikallisesti)' };
        }
    } catch (error) {
        console.error('Overall logout error:', error);
        // Varmista että token poistetaan virhetilanteessakin
        clearAuthToken();
        showToast('Uloskirjautuminen onnistui (paikallisesti)', NotificationSeverity.WARNING);
        return { success: true, message: 'Uloskirjautuminen onnistui (paikallisesti)' };
    }
}

/**
 * Rekisteröi uuden käyttäjän
 * @param {string} username - Käyttäjänimi
 * @param {string} password - Salasana
 * @param {string} email - Sähköposti
 * @returns {Promise<Object>} - Rekisteröintitiedot
 */
export async function register(username, password, email) {
    try {
        // Varmista että email on aina mukana, käytä tyhjää stringiä jos puuttuu
        const userData = {
            kayttajanimi: username,
            salasana: password,
            email: email || "" // Varmista että email on aina määritelty
        };

        console.log('Lähetetään rekisteröintitiedot:', userData);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!data.success) {
            if (data.errors) {
                showValidationErrors(data.errors);
            }
            throw new Error(data.message || 'Rekisteröinti epäonnistui');
        }

        showToast(data.message || 'Rekisteröinti onnistui',
                 data.severity || NotificationSeverity.SUCCESS);

        return data.data || data;
    } catch (error) {
        console.error('Register error:', error);
        showToast(error.message || 'Rekisteröinti epäonnistui', NotificationSeverity.ERROR);
        throw error;
    }
}
