document.addEventListener('DOMContentLoaded', () => {
    // Check which form exists on the current page
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Add event listeners based on which form is present
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Redirect to dashboard if already logged in
        window.location.href = 'dashboard.html';
    }
});

// Function to handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Basic validation
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email/username and password';
        return;
    }

    // Clear previous error message
    errorMessage.textContent = '';

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
            errorMessage.textContent = data.message || 'Login failed. Please try again.';
            return;
        }

        // If login successful, store token and user info
        localStorage.setItem('token', data.token);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred. Please try again later.';
    }
}

// Function to handle register form submission
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    // Basic validation
    if (!username || !email || !password) {
        errorMessage.textContent = 'Please fill in all fields';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        return;
    }

    // Clear previous error message
    errorMessage.textContent = '';

    try {
        // Prepare registration data
        const registerData = {
            username: username,
            email: email,
            password: password
        };

        // Send registration request to backend
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });

        // Parse response
        const data = await response.json();

        if (!response.ok) {
            // Show error message from server
            errorMessage.textContent = data.message || 'Registration failed. Please try again.';
            return;
        }

        // If registration successful, store token and user info if provided
        if (data.token) {
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // If no token is returned, redirect to login page
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error('Registration error:', error);
        errorMessage.textContent = 'An error occurred. Please try again later.';
    }
}
