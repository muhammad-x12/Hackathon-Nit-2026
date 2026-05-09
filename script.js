document.addEventListener("DOMContentLoaded", () => {
    // 1. SELECT CURRENT PAGE
    const path = window.location.pathname;
    const currentPage = path.split("/").pop() || "index.html";
    const isLoggedIn = localStorage.getItem("loggedIn") === "true";

    // 2. AUTHENTICATION GUARD
    // Protects internal dashboard pages from logged-out users
    const protectedPages = ['dashboard.html', 'employees.html', 'inventory.html', 'analytics.html'];
    if (protectedPages.includes(currentPage) && !isLoggedIn) {
        window.location.href = "login.html";
    }

    // 3. DYNAMIC SIDEBAR NAV
    // This finds every link in your sidebar and checks if it matches the current URL
    const navLinks = document.querySelectorAll(".sidebar-nav a");
    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (currentPage === linkPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // 4. LANDING PAGE BUTTON (index.html)
    const authButton = document.getElementById("authButton");
    if (authButton) {
        if (isLoggedIn) {
            authButton.innerHTML = `<a href="dashboard.html" class="nav-cta">Go to Dashboard</a>`;
        } else {
            authButton.innerHTML = `<a href="login.html" class="nav-cta">Get Started</a>`;
        }
    }
});

// LOGOUT FUNCTION
function logout() {
    if(confirm("Log out of BizFlow?")) {
        localStorage.removeItem("loggedIn");
        window.location.href = "index.html";
    }
}