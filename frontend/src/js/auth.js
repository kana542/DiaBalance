/**
 * Authentication logic for DiaBalance frontend
 * Handles login functionality and token management
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth module loaded');

    // Get the login form
    const loginForm = document.getElementById('loginForm');

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        console.log('User already logged in, redirecting to dashboard');
        window.location.href = 'dashboard.html';
        return; // Tärkeä! Lopeta suoritus tässä, ettei muut koodit aja
    }

    // Add event listener for form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

/**
 * Function to handle login form submission
 * @param {Event} event - The form submit event
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Basic validation
    if (!email || !password) {
        displayError(errorMessage, 'Please enter both email/username and password');
        return;
    }

    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    try {
        // CHANGED: Replace mock authentication with actual API call
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kayttajanimi: email, // Map email field to kayttajanimi
                salasana: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle error response
            alert(data.message || 'Kirjautuminen epäonnistui. Tarkista tunnukset.');
            displayError(errorMessage, data.message || 'Login failed. Please check your credentials.');
            resetButton(submitButton, originalButtonText);
            return;
        }

        // CHANGED: Store real token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.user.kayttaja_id,
            username: data.user.kayttajanimi,
            role: data.user.kayttajarooli
        }));

        // Show success message
        alert('Kirjautuminen onnistui!');

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        alert('Yhteysvirhe palvelimeen. Yritä myöhemmin uudelleen.');
        displayError(errorMessage, 'An error occurred connecting to the server. Please try again later.');
        resetButton(submitButton, originalButtonText);
    }
}

/**
 * Helper function to display error message
 * @param {HTMLElement} errorElement - The element to display the error in
 * @param {string} message - The error message to display
 */
function displayError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

/**
 * Helper function to reset button state
 * @param {HTMLElement} button - The button element
 * @param {string} text - The original button text
 */
function resetButton(button, text) {
    button.textContent = text;
    button.disabled = false;
}
