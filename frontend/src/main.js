document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
 
    // Check if user is logged in
    const token = localStorage.getItem('token');
 
    if (token) {
        // User is logged in - näytä uloskirjautumisnappi
        authButton.textContent = 'Logout';
        authButton.addEventListener('click', handleLogout);
    } else {
        // User is not logged in - näytä kirjautumisnappi
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
 
    // Päivitä nappi ja sen toiminto ilman että sivu päivittyy kokonaan
    const authButton = document.getElementById('authButton');
    authButton.textContent = 'Login';
 
    // Poista edellinen event listener ja lisää uusi
    authButton.removeEventListener('click', handleLogout);
    authButton.addEventListener('click', () => {
        window.location.href = './src/pages/login.html';
    });
 
    // Näytä viesti
    alert('You have been logged out successfully.');
 }