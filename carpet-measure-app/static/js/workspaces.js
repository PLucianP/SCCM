// Workspace template for rendering list items
function getWorkspaceTemplate(workspace) {
    return `
        <div class="bg-white rounded-lg shadow-lg p-6" data-id="${workspace.id}">
            <div class="flex items-center justify-between mb-4">
                <div class="flex-1 flex items-center">
                    <div class="w-8 h-8 rounded-full mr-3 border-2 border-gray-200" 
                         style="background-color: ${workspace.color}"></div>
                    <input type="text" value="${workspace.name}" 
                           onchange="WorkspaceManager.updateWorkspaceName('${workspace.id}', this.value)"
                           class="text-xl font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                           title="Click to edit workspace name">
                </div>
                <button onclick="WorkspaceManager.showDeleteConfirmation('${workspace.id}')"
                        class="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            <div class="text-sm text-gray-500">
                Created: ${new Date(workspace.created_at).toLocaleDateString()}
            </div>
        </div>
    `;
}

const WorkspaceManager = {
    // Get CSRF token from cookie
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

    // API functions
    async fetchWorkspaces() {
        try {
            const response = await fetch('/carpet/api/workspaces/');
            if (!response.ok) throw new Error('Failed to fetch workspaces');
            const data = await response.json();
            
            // Handle both array and object with results
            const workspaces = Array.isArray(data) ? data : (data.results || []);
            
            const workspacesList = document.getElementById('workspacesList');
            workspacesList.innerHTML = workspaces.map(workspace => getWorkspaceTemplate(workspace)).join('');
        } catch (error) {
            console.error('Error fetching workspaces:', error);
            this.showError('Failed to load workspaces');
        }
    },

    async saveWorkspace(formData) {
        const workspaceId = formData.get('id');
        const url = workspaceId ? `/carpet/api/workspaces/${workspaceId}/` : '/carpet/api/workspaces/';
        const method = workspaceId ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    color: formData.get('color')
                })
            });
            
            if (!response.ok) throw new Error('Failed to save workspace');
            
            this.closeModal('addWorkspaceModal');
            this.fetchWorkspaces();
            this.showSuccess('Workspace saved successfully');
        } catch (error) {
            console.error('Error saving workspace:', error);
            this.showError('Failed to save workspace');
        }
    },

    currentWorkspaceToDelete: null,

    showDeleteConfirmation(id) {
        this.currentWorkspaceToDelete = id;
        document.getElementById('deleteConfirmModal').classList.remove('hidden');
    },

    closeDeleteModal() {
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        this.currentWorkspaceToDelete = null;
    },

    async deleteWorkspace(id) {
        try {
            const response = await fetch(`/carpet/api/workspaces/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete workspace');
            
            this.closeDeleteModal();
            this.fetchWorkspaces();
            this.showSuccess('Workspace deleted successfully');
        } catch (error) {
            console.error('Error deleting workspace:', error);
            this.showError('Failed to delete workspace');
            this.closeDeleteModal();
        }
    },

    async updateWorkspaceColor(id, color) {
        try {
            const response = await fetch(`/carpet/api/workspaces/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({ color })
            });
            
            if (!response.ok) throw new Error('Failed to update workspace color');
            this.showSuccess('Color updated successfully');
        } catch (error) {
            console.error('Error updating workspace color:', error);
            this.showError('Failed to update color');
        }
    },

    async updateWorkspaceName(id, name) {
        try {
            const response = await fetch(`/carpet/api/workspaces/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({ name })
            });
            
            if (!response.ok) throw new Error('Failed to update workspace name');
            this.showSuccess('Name updated successfully');
        } catch (error) {
            console.error('Error updating workspace name:', error);
            this.showError('Failed to update name');
        }
    },

    // UI functions
    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        this.resetForm();
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        this.resetForm();
    },

    resetForm() {
        const form = document.getElementById('workspaceForm');
        form.reset();
        document.getElementById('workspaceId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Workspace';
        document.getElementById('workspaceColor').value = '#4F46E5';
    },

    // Utility functions
    showSuccess(message) {
        console.log('Success:', message);
        // Implement your success notification
    },

    showError(message) {
        console.error('Error:', message);
        // Implement your error notification
    },

    // Initialize
    init() {
        this.fetchWorkspaces();
        
        // Handle form submission
        document.getElementById('workspaceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await this.saveWorkspace(formData);
        });

        // Handle delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            if (this.currentWorkspaceToDelete) {
                this.deleteWorkspace(this.currentWorkspaceToDelete);
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => WorkspaceManager.init()); 