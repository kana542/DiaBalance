/**
 * Rekisteröintilogiikka DiaBalance-sovellukseen
 * Käsittelee käyttäjän rekisteröitymisen ja API-integraation
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Rekisteröintisivu ladattu');

    // Haetaan rekisteröintilomake
    const registerForm = document.getElementById('registerForm');

    // Tarkistetaan onko käyttäjä jo kirjautunut
    const token = localStorage.getItem('token');
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
    if (!username || !email || !password) {
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
        // CHANGED: Replace fetch call with proper endpoint and parameters
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kayttajanimi: username, // Map username field to kayttajanimi
                salasana: password,
                // Use email as additional info (if backend is updated later)
                // email: email
            })
        });

        // Process the response
        const data = await response.json();

        if (!response.ok) {
            // CHANGED: Display error with alert and in error element
            alert(data.message || 'Rekisteröinti epäonnistui.');
            showError(errorMessage, data.message || 'Rekisteröinti epäonnistui. Yritä uudelleen.');
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            return;
        }

        // Display success message with alert
        alert('Rekisteröinti onnistui! Voit nyt kirjautua sisään uudella tililläsi.');

        // Redirect to login page
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Rekisteröintivirhe:', error);
        alert('Yhteysvirhe palvelimeen. Yritä myöhemmin uudelleen.');
        showError(errorMessage, 'Tapahtui virhe yhdistettäessä palvelimeen. Yritä myöhemmin uudelleen.');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
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
 * Näyttää virheilmoituksen
 * @param {HTMLElement} errorElement - Elementti, johon virheilmoitus näytetään
 * @param {string} message - Virheilmoituksen teksti
 */
function showError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Vieritetään virheviestielementtiin
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Jos virheilmoituselementtiä ei löydy, käytetään alert-funktiota
        alert('Virhe: ' + message);
    }
}
