/**
 * Authentication check for protected pages
 * This file should be included in dashboard.html and other protected pages
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth check running...');
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
        // No token found, redirect to login page
        console.log('No authentication token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    // Validate token with backend
    validateToken(token)
        .then(isValid => {
            if (!isValid) {
                // Invalid token, redirect to login page
                console.log('Invalid token, redirecting to login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            } else {
                // Token is valid, continue loading dashboard
                console.log('Authentication successful');
                // Update UI with user information if needed
                updateUserInfo();
            }
        })
        .catch(error => {
            console.error('Token validation error:', error);
            // On error, redirect to login page
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
});

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
 * Function to update the UI with user information
 */
function updateUserInfo() {
    try {
        const userString = localStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            
            // Update username in the header if the element exists
            const usernameElement = document.getElementById('username');
            if (usernameElement && user.username) {
                usernameElement.textContent = user.username;
            }
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}