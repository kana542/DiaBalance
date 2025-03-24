document.addEventListener('DOMContentLoaded', () => {
   const authButton = document.getElementById('authButton');

   // Check if user is logged in
   const token = localStorage.getItem('token');

   if (token) {
       // User is logged in
       authButton.textContent = 'Logout';
       authButton.addEventListener('click', handleLogout);
   } else {
       // User is not logged in
       authButton.textContent = 'login';
       authButton.addEventListener('click', () => {
           window.location.href = './src/pages/login.html';
       });
   }
});

// Function to handle logout
function handleLogout() {
   // Remove token from localStorage
   localStorage.removeItem('token');
   localStorage.removeItem('user');

   // Update button and its event listener
   const authButton = document.getElementById('authButton');
   authButton.textContent = 'Login';

   // Remove previous event listener and add new one
   authButton.removeEventListener('click', handleLogout);
   authButton.addEventListener('click', () => {
       window.location.href = './src/pages/login.html';
   });

   // Optional: Show logout message
   alert('You have been logged out successfully.');
}
