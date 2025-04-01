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
        // Validate token before redirecting
        validateToken(token)
            .then(isValid => {
                if (isValid) {
                    // Redirect to dashboard if already logged in with valid token
                    window.location.href = 'dashboard.html';
                } else {
                    // Token is invalid, remove it
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            })
            .catch(error => {
                console.error('Token validation error:', error);
                // On error, remove potentially invalid token
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            });
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
        // Prepare login data
        const loginData = {
            email: email,
            password: password
        };

        // Send login request to backend
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        // Parse response
        const data = await response.json();

        if (!response.ok) {
            // Show error message from server
            displayError(errorMessage, data.message || 'Login failed. Please try again.');
            resetButton(submitButton, originalButtonText);
            return;
        }

        // If login successful, store token and user info
        localStorage.setItem('token', data.token);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Show success message
        alert('Login successful!');

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        displayError(errorMessage, 'An error occurred connecting to the server. Please try again later.');
        resetButton(submitButton, originalButtonText);
    }
}

/**
 * Function to validate JWT token with backend
 * @param {string} token - The JWT token to validate
 * @returns {Promise<boolean>} - Promise resolving to true if token is valid
 */
async function validateToken(token) {
    try {
        const response = await fetch('http://localhost:3000/api/auth/validate', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.valid === true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
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