// Document template for rendering list items
function getDocumentTemplate(doc) {
    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden" data-id="${doc.id}">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex-1">
                        <h2 class="text-xl font-semibold">${doc.name}</h2>
                        <p class="text-sm text-gray-500">Last updated: ${new Date(doc.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="DocumentManager.editDocument('${doc.id}')" 
                                class="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button onclick="DocumentManager.showDeleteConfirmation('${doc.id}')"
                                class="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-medium mb-2">Template Preview</h3>
                        <img src="${doc.template_image}" alt="${doc.name}" 
                             class="w-full h-48 object-cover rounded-lg bg-gray-100">
                    </div>
                    
                    <div>
                        <h3 class="font-medium mb-2">Selected Fields</h3>
                        <div class="space-y-4">
                            ${doc.order_fields.length > 0 ? `
                            <div>
                                <h4 class="text-sm font-medium text-gray-700">Order Fields:</h4>
                                <div class="mt-1 space-y-1">
                                    ${doc.order_fields.map(field => `
                                        <div class="text-sm text-gray-600 flex items-center">
                                            <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            ${field}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            ${doc.company_fields.length > 0 ? `
                            <div>
                                <h4 class="text-sm font-medium text-gray-700">Company Fields:</h4>
                                <div class="mt-1 space-y-1">
                                    ${doc.company_fields.map(field => `
                                        <div class="text-sm text-gray-600 flex items-center">
                                            <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            ${field}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            ${doc.text_sections && doc.text_sections.length > 0 ? `
                            <div>
                                <h4 class="text-sm font-medium text-gray-700">Text Sections:</h4>
                                <div class="mt-1 space-y-2">
                                    ${doc.text_sections.map(section => `
                                        <div class="text-sm">
                                            <span class="font-medium">${section.id}:</span>
                                            <p class="text-gray-600 mt-1">${section.content.substring(0, 100)}${section.content.length > 100 ? '...' : ''}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const DocumentManager = {
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
    async fetchDocuments() {
        try {
            const response = await fetch('/carpet/api/documents/');
            if (!response.ok) throw new Error('Failed to fetch documents');
            const data = await response.json();
            
            // Handle both array and object with results
            const documents = Array.isArray(data) ? data : (data.results || []);
            
            const documentsList = document.getElementById('documentsList');
            documentsList.innerHTML = documents.map(doc => getDocumentTemplate(doc)).join('');
        } catch (error) {
            console.error('Error fetching documents:', error);
            this.showError('Failed to load documents');
        }
    },

    async saveDocument(formData) {
        const documentId = formData.get('id');
        const url = documentId ? `/carpet/api/documents/${documentId}/` : '/carpet/api/documents/';
        const method = documentId ? 'PUT' : 'POST';

        // Get selected order fields
        const orderFields = Array.from(document.querySelectorAll('input[name="order_fields"]:checked'))
            .map(input => input.value);

        // Get selected company fields
        const companyFields = Array.from(document.querySelectorAll('input[name="company_fields"]:checked'))
            .map(input => input.value);

        // Get text sections
        const textSections = Array.from(document.getElementById('textSections').children)
            .map(section => {
                const idInput = section.querySelector('input[name$=".id"]');
                const contentInput = section.querySelector('textarea[name$=".content"]');
                if (idInput && contentInput) {
                    return {
                        id: idInput.value,
                        content: contentInput.value
                    };
                }
                return null;
            })
            .filter(section => section !== null);

        try {
            // Handle template image upload first if exists
            let templateImageUrl = '';
            const templateImage = formData.get('template_image');
            if (templateImage && templateImage.size > 0) {
                const imageFormData = new FormData();
                imageFormData.append('file', templateImage);
                
                const uploadResponse = await fetch('/carpet/api/upload/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': this.getCSRFToken(),
                    },
                    body: imageFormData
                });
                
                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload template image');
                }
                
                const uploadResult = await uploadResponse.json();
                templateImageUrl = uploadResult.url;
            }

            // Create the main document
            const documentData = {
                name: formData.get('name'),
                type: formData.get('type'),
                order_fields: orderFields,
                company_fields: companyFields,
                text_sections: textSections,
                is_active: true,
                template_image: templateImageUrl || formData.get('template_image_url')
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify(documentData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }
            
            this.closeModal('addDocumentModal');
            this.fetchDocuments();
            this.showSuccess('Document saved successfully');
        } catch (error) {
            console.error('Error saving document:', error);
            let errorMessage = 'Failed to save document';
            try {
                const errorData = JSON.parse(error.message);
                errorMessage = Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');
            } catch (e) {
                errorMessage = error.message;
            }
            this.showError(errorMessage);
        }
    },

    currentDocumentToDelete: null,

    showDeleteConfirmation(id) {
        this.currentDocumentToDelete = id;
        document.getElementById('deleteConfirmModal').classList.remove('hidden');
    },

    closeDeleteModal() {
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        this.currentDocumentToDelete = null;
    },

    async deleteDocument(id) {
        if (!id) return;
        
        try {
            const response = await fetch(`/carpet/api/documents/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete document');
            
            this.closeDeleteModal();
            this.fetchDocuments();
            this.showSuccess('Document deleted successfully');
        } catch (error) {
            console.error('Error deleting document:', error);
            this.showError('Failed to delete document');
        }
    },

    async editDocument(id) {
        try {
            const response = await fetch(`/carpet/api/documents/${id}/`);
            if (!response.ok) throw new Error('Failed to fetch document');
            const doc = await response.json();
            
            // Set basic fields
            document.getElementById('documentId').value = doc.id;
            document.getElementById('documentName').value = doc.name;
            document.getElementById('documentType').value = doc.type;
            document.getElementById('modalTitle').textContent = 'Edit Document';

            // Set template preview if exists
            if (doc.template_image) {
                const preview = document.getElementById('templatePreview');
                preview.src = doc.template_image;
                preview.classList.remove('hidden');
            }

            // Check order fields
            doc.order_fields.forEach(field => {
                const checkbox = document.querySelector(`input[name="order_fields"][value="${field}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Check company fields
            doc.company_fields.forEach(field => {
                const checkbox = document.querySelector(`input[name="company_fields"][value="${field}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Add text sections
            const textSectionsContainer = document.getElementById('textSections');
            textSectionsContainer.innerHTML = ''; // Clear existing sections
            if (doc.text_sections && doc.text_sections.length > 0) {
                doc.text_sections.forEach((section, index) => {
                    const sectionElement = document.createElement('div');
                    sectionElement.className = 'space-y-2';
                    sectionElement.innerHTML = `
                        <div class="flex items-center justify-between">
                            <input type="text" placeholder="Section ID" name="text_sections[${index}].id"
                                   value="${section.id}"
                                   class="flex-1 mr-2 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <button type="button" onclick="this.parentElement.parentElement.remove()" 
                                    class="text-red-600 hover:text-red-800">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <textarea placeholder="Section Content" name="text_sections[${index}].content" rows="3"
                                  class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">${section.content}</textarea>
                    `;
                    textSectionsContainer.appendChild(sectionElement);
                });
            }

            // Open the modal
            this.openModal('addDocumentModal');
        } catch (error) {
            console.error('Error loading document:', error);
            this.showError('Failed to load document');
        }
    },

    // UI functions
    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        // Only reset form when adding a new document, not when editing
        if (document.getElementById('documentId').value === '') {
            this.resetForm();
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        this.resetForm();
    },

    resetForm() {
        // Uncheck all checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        const form = document.getElementById('documentForm');
        form.reset();
        document.getElementById('documentId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Document';
        document.getElementById('templatePreview').classList.add('hidden');
        document.getElementById('textSections').innerHTML = '';
    },

    addTextSection() {
        const container = document.getElementById('textSections');
        const sectionId = container.children.length;
        
        const section = document.createElement('div');
        section.className = 'space-y-2';
        section.innerHTML = `
            <div class="flex items-center justify-between">
                <input type="text" placeholder="Section ID" name="text_sections[${sectionId}].id"
                       class="flex-1 mr-2 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <button type="button" onclick="this.parentElement.parentElement.remove()" 
                        class="text-red-600 hover:text-red-800">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <textarea placeholder="Section Content" name="text_sections[${sectionId}].content" rows="3"
                      class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
        `;
        
        container.appendChild(section);
    },

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('templatePreview');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    },

    // Initialize
    init() {
        this.fetchDocuments();
        
        // Handle form submission
        document.getElementById('documentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await this.saveDocument(formData);
        });
        
        // Handle delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            if (this.currentDocumentToDelete) {
                this.deleteDocument(this.currentDocumentToDelete);
            }
        });
        
        // Handle image upload
        document.getElementById('templateImage').addEventListener('change', this.handleImageUpload);
    },

    // Utility functions
    showSuccess(message) {
        // You can implement a proper notification system here
        alert(message);
    },

    showError(message) {
        // You can implement a proper notification system here
        alert(message);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => DocumentManager.init()); 