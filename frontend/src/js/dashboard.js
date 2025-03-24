document.addEventListener('DOMContentLoaded', () => {
    const authStatus = document.getElementById('authStatus');
    const logoutButton = document.getElementById('logoutButton');

    // Add event listener for logout button
    logoutButton.addEventListener('click', handleLogout);

    // Check if user is logged in
    const token = localStorage.getItem('token');

    if (!token) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // Validate token on the server
    validateToken(token);
});

// Function to validate token with the server
async function validateToken(token) {
    const authStatus = document.getElementById('authStatus');

    try {
        // Send request to verify token
        const response = await fetch('http://localhost:3000/api/auth/validate', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // If token is invalid, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        // Token is valid
        authStatus.textContent = 'OK';

        // Get user info if it exists
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.username) {
            authStatus.textContent += ` - Welcome, ${user.username}!`;
        }

    } catch (error) {
        console.error('Token validation error:', error);
        authStatus.textContent = 'Authentication error';

        // Keep user on dashboard but show error message
        // In a real application, you might handle this differently
    }
}

// Function to handle logout
function handleLogout() {
    // Remove token and user info from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '../../index.html';
}
