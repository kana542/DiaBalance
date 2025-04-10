const API_BASE_URL = 'http://localhost:3000/api';

export function getAuthToken() {
    return localStorage.getItem('token');
}

export function clearAuthToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

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

export async function apiGet(endpoint) {
    const response = await fetchWithAuth(endpoint);
    return response.json();
}

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

export async function apiDelete(endpoint) {
    const response = await fetchWithAuth(endpoint, {
        method: 'DELETE'
    });
    return response.json();
}

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

        // Log Kubios login status
        if (data.kubios) {
            console.log('Kubios login status:', data.kubios.success ? 'Success' : 'Failed');
            if (data.kubios.message) {
                console.log('Kubios message:', data.kubios.message);
            }
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function logout() {
    try {
        const token = getAuthToken();

        if (!token) {
            console.log('No authentication token found, already logged out');
            clearAuthToken();
            return { message: 'Uloskirjautuminen onnistui' };
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
                return data;
            } else {
                console.warn('Server-side logout failed:', response.status);
                return { message: 'Uloskirjautuminen onnistui (paikallisesti)' };
            }
        } catch (fetchError) {
            console.error('Error during server logout request:', fetchError);
            return { message: 'Uloskirjautuminen onnistui (paikallisesti)' };
        }
    } catch (error) {
        console.error('Overall logout error:', error);
        // Varmista että token poistetaan virhetilanteessakin
        clearAuthToken();
        return { message: 'Uloskirjautuminen onnistui (paikallisesti)' };
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

        if (!response.ok) {
            throw new Error(data.message || 'Rekisteröinti epäonnistui');
        }

        return data;
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
}
