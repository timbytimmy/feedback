document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminLoginSection = document.getElementById('admin-login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const feedbackTableBody = document.querySelector('#feedback-table tbody');
    const logoutBtn = document.getElementById('logout-btn');

    let adminToken = null;

    // Admin login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.style.display = 'none';
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value.trim();
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                adminToken = data.token;
                showAdminDashboard();
                fetchFeedbacks();
            } else {
                loginError.textContent = 'Invalid credentials';
                loginError.style.display = 'block';
            }
        });
    }

    // Fetch all feedbacks for admin
    async function fetchFeedbacks() {
        const res = await fetch('/api/feedback', {
            headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (res.ok) {
            const feedbacks = await res.json();
            renderFeedbackTable(feedbacks);
        }
    }

    // Render feedback table
    function renderFeedbackTable(feedbacks) {
        feedbackTableBody.innerHTML = '';
        feedbacks.forEach(fb => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fb.id}</td>
                <td>${fb.name}</td>
                <td>${fb.email}</td>
                <td>${fb.feedback}</td>
                <td>${new Date(fb.submitted_at).toLocaleString()}</td>
            `;
            feedbackTableBody.appendChild(tr);
        });
    }

    // Show admin dashboard, hide others
    function showAdminDashboard() {
        adminLoginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            adminToken = null;
            adminDashboard.style.display = 'none';
            adminLoginSection.style.display = 'block';
        });
    }
}); 