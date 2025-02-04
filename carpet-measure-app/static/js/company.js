const CompanyManager = {
    currentCompanyToDelete: null,

    openModal(modalId, shouldReset = true) {
        document.getElementById(modalId).classList.remove('hidden');
        if (shouldReset) {
            this.resetForm();
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        this.resetForm();
    },

    resetForm() {
        const form = document.getElementById('companyForm');
        form.reset();
        document.getElementById('companyId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Company';
    },

    async editCompany(id) {
        try {
            const response = await fetch(`/carpet/api/companies/${id}/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const company = await response.json();
            console.log('Company data:', company); // Debug log
            
            // Open modal first without resetting
            this.openModal('addCompanyModal', false);
            
            // Then fill form with company data
            document.getElementById('companyId').value = company.id;
            document.getElementById('companyName').value = company.name;
            document.getElementById('companyPhone').value = company.phone;
            document.getElementById('companyAddress').value = company.address;
            document.getElementById('workingHours').value = company.working_hours;
            
            document.getElementById('modalTitle').textContent = 'Edit Company';
        } catch (error) {
            console.error('Error fetching company:', error);
            alert('Failed to load company data. Please try again.');
        }
    },

    showDeleteConfirmation(id) {
        this.currentCompanyToDelete = id;
        document.getElementById('deleteConfirmModal').classList.remove('hidden');
    },

    closeDeleteModal() {
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        this.currentCompanyToDelete = null;
    },

    async deleteCompany(id) {
        try {
            const response = await fetch(`/carpet/api/companies/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete company');
            
            window.location.reload();
        } catch (error) {
            console.error('Error deleting company:', error);
            alert('Failed to delete company. Please try again.');
        }
    },

    getCSRFToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },

    init() {
        // Handle delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            if (this.currentCompanyToDelete) {
                this.deleteCompany(this.currentCompanyToDelete);
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => CompanyManager.init()); 