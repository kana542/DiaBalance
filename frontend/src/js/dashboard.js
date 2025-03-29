document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    // Add event listener for logout button
    logoutButton.addEventListener('click', handleLogout);

    // Comment out authentication code for now
    /*
    // Check if user is logged in
    const token = localStorage.getItem('token');

    if (!token) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // Validate token on the server
    validateToken(token);
    */

    // Instead, just initialize the dashboard
    initializeDashboard();
});

// Function to initialize dashboard components
function initializeDashboard() {
    // Initialize calendar
    initializeCalendar();

    // Initialize chart placeholder
    initializeChartPlaceholder();
}

// Calendar functionality
function initializeCalendar() {
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    let currentDate = new Date();

    const updateCalendar = () => {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();

        // Adjust for Monday as first day of week (0 = Monday in our grid)
        let firstDayIndex = firstDay.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6; // Sunday becomes 6

        let lastDayIndex = lastDay.getDay() - 1;
        if (lastDayIndex === -1) lastDayIndex = 6;

        const monthYearString = currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });
        monthYearElement.textContent = monthYearString;

        let datesHTML = "";

        // Previous month days
        for (let i = firstDayIndex; i > 0; i--) {
            const prevDate = new Date(currentYear, currentMonth, 0 - i + 1);
            datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const today = new Date();

            // Check if date is today
            const isToday = date.getDate() === today.getDate() &&
                           date.getMonth() === today.getMonth() &&
                           date.getFullYear() === today.getFullYear();

            // Add notification for specific dates (for UI demo purposes)
            const hasNotification = [1, 2, 9, 13, 15].includes(i);

            const activeClass = isToday ? "active" : "";
            const notificationClass = hasNotification ? "has-notification" : "";

            datesHTML += `<div class="date ${activeClass} ${notificationClass}">${i}</div>`;
        }

        // Next month days
        for (let i = 1; i <= 7 - lastDayIndex - 1; i++) {
            const nextDate = new Date(currentYear, currentMonth + 1, i);
            datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;
        }

        datesElement.innerHTML = datesHTML;

        // Add click event listeners to dates
        document.querySelectorAll('.date:not(.inactive)').forEach(dateElement => {
            dateElement.addEventListener('click', () => {
                // Remove active class from all dates
                document.querySelectorAll('.date').forEach(el => {
                    el.classList.remove('active');
                });

                // Add active class to clicked date
                dateElement.classList.add('active');

                // This would trigger data loading for the selected date in a real implementation
            });
        });
    };

    prevBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar();
}

// Placeholder function to initialize chart (just for UI demo)
function initializeChartPlaceholder() {
    const chartPlaceholder = document.getElementById('chart-placeholder');
    if (!chartPlaceholder) return;

    // Draw a placeholder chart line
    const beforeLine = document.createElement('div');
    beforeLine.style.position = 'absolute';
    beforeLine.style.left = '10%';
    beforeLine.style.right = '10%';
    beforeLine.style.top = '40%';
    beforeLine.style.height = '2px';
    beforeLine.style.backgroundColor = '#ff5869';
    beforeLine.style.borderRadius = '2px';

    // Add some variation to make it look like a chart
    beforeLine.style.clipPath = 'polygon(0% 0%, 20% 30%, 40% 10%, 60% 20%, 80% 0%, 100% 20%)';

    const afterLine = document.createElement('div');
    afterLine.style.position = 'absolute';
    afterLine.style.left = '10%';
    afterLine.style.right = '10%';
    afterLine.style.top = '30%';
    afterLine.style.height = '2px';
    afterLine.style.backgroundColor = '#4ecdc4';
    afterLine.style.borderRadius = '2px';

    // Add some variation to make it look like a chart
    afterLine.style.clipPath = 'polygon(0% 0%, 20% 40%, 40% 20%, 60% 30%, 80% 10%, 100% 30%)';

    chartPlaceholder.appendChild(beforeLine);
    chartPlaceholder.appendChild(afterLine);
}

// Function to validate token with the server - commented out for now
/*
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
*/

// Function to handle logout
function handleLogout() {
    // For demonstration only - no actual logout functionality yet
    console.log('Logout clicked');

    // Remove token and user info from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // In a real implementation, this would redirect to login page
    // window.location.href = '../../index.html';
}
