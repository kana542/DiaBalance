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
        // DEV MODE: Accept any credentials in development mode
        console.log('DEV MODE: Bypassing actual login, accepting any credentials');
        
        // Set mock token and user data for development
        localStorage.setItem('token', 'dev-token-123');
        localStorage.setItem('user', JSON.stringify({
            id: 'dev-user-id',
            username: email.split('@')[0], // Use part of email as username
            email: email,
            role: 'user'
        }));

        // Show success message
        alert('DEV MODE: Login successful with mock credentials');

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
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