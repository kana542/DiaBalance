/**
 * Modified version of register.js to only show validation messages when needed
 */

import { register, getAuthToken } from '../utils/api-client.js';
import { showError, showToast } from '../utils/ui-utils.js';
import { evaluatePasswordStrength, doPasswordsMatch, updatePasswordStrengthMeter } from './password-validation.js';

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

    // Validoi käyttäjänimi
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
        showError(errorMessage, 'Käyttäjänimi voi sisältää vain kirjaimia, numeroita, alaviivoja ja väliviivoja (3-20 merkkiä)');
        return;
    }

    // Validoi sähköposti jos annettu
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError(errorMessage, 'Syötä kelvollinen sähköpostiosoite');
            return;
        }
    }

    // Tarkista salasanan vahvuus
    const strengthInfo = evaluatePasswordStrength(password);
    if (!strengthInfo.isValid) {
        showError(errorMessage, 'Salasana ei täytä vahvuusvaatimuksia');
        return;
    }

    // Tarkista salasanojen täsmäävyys
    if (!doPasswordsMatch(password, confirmPassword)) {
        showError(errorMessage, 'Salasanat eivät täsmää');
        return;
    }

    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Luodaan tiliä...';
    submitButton.disabled = true;

    try {
        // Käytä API-clientia rekisteröintiin
        await register(username, password, email);

        showToast('Rekisteröinti onnistui! Voit nyt kirjautua sisään uudella tililläsi.', 'success');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);

    } catch (error) {
        console.error('Rekisteröintivirhe:', error);
        showError(errorMessage, error.message || 'Rekisteröinti epäonnistui. Yritä uudelleen.');
        resetButton(submitButton, originalButtonText);
    }
}

/**
 * Asettaa lomakkeen kenttien validoinnin
 * Modified to only show validation messages when needed
 */
function setupFormValidation() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('errorMessage');

    // Käyttäjänimen validointi
    if (usernameInput) {
        // Validoi käyttäjänimi syötettäessä
        usernameInput.addEventListener('input', () => {
            const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
            const isValid = usernameRegex.test(usernameInput.value);
            
            if (usernameInput.value.length > 0) {
                if (isValid) {
                    usernameInput.classList.add('valid');
                    usernameInput.classList.remove('invalid');
                } else {
                    usernameInput.classList.add('invalid');
                    usernameInput.classList.remove('valid');
                    
                    // Create validation message if it doesn't exist
                    let usernameRequirements = usernameInput.parentNode.querySelector('.validation-message');
                    if (!usernameRequirements) {
                        usernameRequirements = document.createElement('div');
                        usernameRequirements.className = 'validation-message';
                        usernameInput.parentNode.appendChild(usernameRequirements);
                    }
                    
                    usernameRequirements.textContent = 'Käyttäjänimi: 3-20 merkkiä, vain kirjaimia, numeroita, alaviivoja ja väliviivoja.';
                    usernameRequirements.classList.add('invalid');
                    usernameRequirements.style.display = 'block';
                }
            } else {
                usernameInput.classList.remove('valid', 'invalid');
                
                // Hide any validation message
                const usernameRequirements = usernameInput.parentNode.querySelector('.validation-message');
                if (usernameRequirements) {
                    usernameRequirements.style.display = 'none';
                }
            }
        });

        // Validoi myös kun kenttä menettää fokuksen
        usernameInput.addEventListener('blur', () => {
            if (usernameInput.value.length > 0) {
                const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
                if (!usernameRegex.test(usernameInput.value)) {
                    showError(errorMessage, 'Käyttäjänimi voi sisältää vain kirjaimia, numeroita, alaviivoja ja väliviivoja (3-20 merkkiä)');
                } else {
                    errorMessage.style.display = 'none';
                }
            }
        });
    }

    // Sähköpostiosoitteen validointi
    if (emailInput) {
        // Validoi sähköposti syötettäessä
        emailInput.addEventListener('input', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (emailInput.value.length > 0) {
                if (emailRegex.test(emailInput.value)) {
                    emailInput.classList.add('valid');
                    emailInput.classList.remove('invalid');
                    
                    // Hide any validation message
                    const emailRequirements = emailInput.parentNode.querySelector('.validation-message');
                    if (emailRequirements) {
                        emailRequirements.style.display = 'none';
                    }
                } else {
                    emailInput.classList.add('invalid');
                    emailInput.classList.remove('valid');
                    
                    // Create validation message if it doesn't exist
                    let emailRequirements = emailInput.parentNode.querySelector('.validation-message');
                    if (!emailRequirements) {
                        emailRequirements = document.createElement('div');
                        emailRequirements.className = 'validation-message invalid';
                        emailInput.parentNode.appendChild(emailRequirements);
                    }
                    
                    emailRequirements.textContent = 'Syötä kelvollinen sähköpostiosoite (esim. esimerkki@domain.fi)';
                    emailRequirements.style.display = 'block';
                }
            } else {
                emailInput.classList.remove('valid', 'invalid');
                
                // Hide any validation message
                const emailRequirements = emailInput.parentNode.querySelector('.validation-message');
                if (emailRequirements) {
                    emailRequirements.style.display = 'none';
                }
            }
        });
    }

    // Salasanan vahvuuden validointi
    if (passwordInput) {
        // Validoi salasanan vahvuus kirjoitettaessa
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length > 0) {
                const strengthInfo = evaluatePasswordStrength(passwordInput.value);
                updatePasswordStrengthMeter(passwordInput.parentNode, strengthInfo);
                
                if (strengthInfo.isValid) {
                    passwordInput.classList.add('valid');
                    passwordInput.classList.remove('invalid');
                } else {
                    passwordInput.classList.add('invalid');
                    passwordInput.classList.remove('valid');
                }
                
                // Päivitä myös vahvistuskenttä, jos siinä on sisältöä
                if (confirmPasswordInput.value) {
                    const passwordsMatch = doPasswordsMatch(passwordInput.value, confirmPasswordInput.value);
                    if (passwordsMatch) {
                        confirmPasswordInput.classList.add('valid');
                        confirmPasswordInput.classList.remove('invalid');
                        
                        // Hide any validation message
                        const confirmRequirements = confirmPasswordInput.parentNode.querySelector('.validation-message');
                        if (confirmRequirements) {
                            confirmRequirements.style.display = 'none';
                        }
                    } else {
                        confirmPasswordInput.classList.add('invalid');
                        confirmPasswordInput.classList.remove('valid');
                        
                        // Create validation message if it doesn't exist
                        let confirmRequirements = confirmPasswordInput.parentNode.querySelector('.validation-message');
                        if (!confirmRequirements) {
                            confirmRequirements = document.createElement('div');
                            confirmRequirements.className = 'validation-message invalid';
                            confirmPasswordInput.parentNode.appendChild(confirmRequirements);
                        }
                        
                        confirmRequirements.textContent = 'Salasanat eivät täsmää';
                        confirmRequirements.style.display = 'block';
                    }
                }
            } else {
                passwordInput.classList.remove('valid', 'invalid');
                
                // Hide strength meter
                const passwordParent = passwordInput.parentNode;
                const strengthMeter = passwordParent.querySelector('.password-strength-container');
                if (strengthMeter) {
                    strengthMeter.style.display = 'none';
                }
            }
        });
    }

    // Salasanan vahvistuksen validointi
    if (confirmPasswordInput && passwordInput) {
        // Validoi vahvistus syötettäessä
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value.length > 0) {
                const passwordsMatch = doPasswordsMatch(passwordInput.value, confirmPasswordInput.value);
                
                if (passwordsMatch) {
                    confirmPasswordInput.classList.add('valid');
                    confirmPasswordInput.classList.remove('invalid');
                    
                    // Hide any validation message
                    const confirmRequirements = confirmPasswordInput.parentNode.querySelector('.validation-message');
                    if (confirmRequirements) {
                        confirmRequirements.style.display = 'none';
                    }
                } else {
                    confirmPasswordInput.classList.add('invalid');
                    confirmPasswordInput.classList.remove('valid');
                    
                    // Create validation message if it doesn't exist
                    let confirmRequirements = confirmPasswordInput.parentNode.querySelector('.validation-message');
                    if (!confirmRequirements) {
                        confirmRequirements = document.createElement('div');
                        confirmRequirements.className = 'validation-message invalid';
                        confirmPasswordInput.parentNode.appendChild(confirmRequirements);
                    }
                    
                    confirmRequirements.textContent = 'Salasanat eivät täsmää';
                    confirmRequirements.style.display = 'block';
                }
            } else {
                confirmPasswordInput.classList.remove('valid', 'invalid');
                
                // Hide any validation message
                const confirmRequirements = confirmPasswordInput.parentNode.querySelector('.validation-message');
                if (confirmRequirements) {
                    confirmRequirements.style.display = 'none';
                }
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