import { login, getAuthToken } from '../utils/api-client.js';
import { showError, NotificationSeverity, showToast } from '../utils/ui-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth module loaded');

    // Get the login form
    const loginForm = document.getElementById('loginForm');

    // Check if user is already logged in
    const token = getAuthToken();
    if (token) {
        console.log('User already logged in, redirecting to dashboard');
        window.location.href = 'dashboard.html';
        return;
    }

    // Add event listener for form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Basic validation
    if (!email || !password) {
        showError(errorMessage, 'Please enter both email/username and password');
        return;
    }

    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    try {
        // Login using API client
        await login(email, password);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        showError(errorMessage, error.message || 'Kirjautuminen epäonnistui. Tarkista tunnukset.');
        resetButton(submitButton, originalButtonText);
    }
}

function resetButton(button, text) {
    button.textContent = text;
    button.disabled = false;
}

export {
    handleLogin
};
