const ProfileManager = {
    init() {
        this.initializeToggles();
        this.setupEventListeners();
    },

    initializeToggles() {
        // Get saved preferences from localStorage
        const emailNotifications = localStorage.getItem('emailNotifications') === 'true';
        const darkMode = localStorage.getItem('darkMode') === 'true';

        // Set initial toggle states
        document.getElementById('emailNotifications').checked = emailNotifications;
        document.getElementById('darkMode').checked = darkMode;
    },

    setupEventListeners() {
        // Email notifications toggle
        document.getElementById('emailNotifications').addEventListener('change', (e) => {
            localStorage.setItem('emailNotifications', e.target.checked);
        });

        // Dark mode toggle
        document.getElementById('darkMode').addEventListener('change', (e) => {
            localStorage.setItem('darkMode', e.target.checked);
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => ProfileManager.init());

function togglePasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.classList.toggle('hidden');
    }
} 