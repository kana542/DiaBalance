document.addEventListener('DOMContentLoaded', () => {
    // Get the register form
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Redirect to dashboard if already logged in
        window.location.href = 'dashboard.html';
    }

    // Add event listener for form submission
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Form field validations
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput && confirmPasswordInput) {
        // Check password match on typing
        confirmPasswordInput.addEventListener('input', () => {
            if (passwordInput.value && confirmPasswordInput.value) {
                if (passwordInput.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.style.borderColor = '#e74c3c';
                } else {
                    confirmPasswordInput.style.borderColor = '#4b6cb7';
                }
            }
        });
        
        // Check password length on typing
        passwordInput.addEventListener('input', () => {
            const passwordRequirements = document.querySelector('.password-requirements');
            if (passwordInput.value.length > 0 && passwordInput.value.length < 8) {
                passwordRequirements.style.color = '#e74c3c';
            } else if (passwordInput.value.length >= 8) {
                passwordRequirements.style.color = '#2ecc71';
            } else {
                passwordRequirements.style.color = '#777';
            }
        });
    }
});

// Function to handle register form submission
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    // Reset error styling
    errorMessage.style.display = 'none';
    
    // Basic validation
    if (!username || !email || !password) {
        showError('Please fill in all required fields');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (password.length < 8) {
        showError('Password should be at least 8 characters long');
        return;
    }

    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;

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
            showError(data.message || 'Registration failed. Please try again.');
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            return;
        }

        // Show success message with alert as requested in requirements
        alert('Registration successful! Please log in with your new account.');
        
        // Redirect to login page as requested in requirements
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred connecting to the server. Please try again later.');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

// Helper function to show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Scroll to error message
    errorMessage.scrollIntoVie
    w({ behavior: 'smooth', block: 'center' });
}