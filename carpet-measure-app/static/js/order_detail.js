document.addEventListener('DOMContentLoaded', function() {
    // Auto-calculate area when length or width changes
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const length = product.querySelector('input[name="length"]');
        const width = product.querySelector('input[name="width"]');
        const area = product.querySelector('input[name="area"]');

        const calculateArea = () => {
            if (length.value && width.value) {
                area.value = ((length.value * width.value) / 10000).toFixed(2);
            }
        };

        length.addEventListener('input', calculateArea);
        width.addEventListener('input', calculateArea);
    });

    // Calculate initial totals when page loads
    updateOrderTotals();

    // Listen for changes in price per sqm
    document.getElementById('pricePerSqm').addEventListener('input', function() {
        document.querySelectorAll('.product-card').forEach(updateItemCalculations);
    });

    // Listen for changes in dimensions for each product
    document.querySelectorAll('.product-card').forEach(card => {
        const lengthInput = card.querySelector('input[name="length"]');
        const widthInput = card.querySelector('input[name="width"]');

        lengthInput.addEventListener('input', () => updateItemCalculations(card));
        widthInput.addEventListener('input', () => updateItemCalculations(card));
    });
});

// QR Code functionality
function printQRCode(clientName, phone, orderNumber, productCount) {
    console.log('1. Starting printQRCode with:', { clientName, phone, orderNumber, productCount });
    
    try {
        // Get the product card element
        const productIndex = parseInt(productCount.split('/')[0]) - 1;
        const totalProducts = document.querySelectorAll('.product-card').length;
        console.log('2. Product index:', productIndex);
        
        const product = document.querySelectorAll('.product-card')[productIndex];
        console.log('3. Found product card:', !!product);
        
        if (!product) {
            throw new Error('Product card not found');
        }
        
        // Get all product measurements
        const inputs = product.querySelectorAll('input[type="number"]');
        console.log('4. Found product inputs:', inputs.length);
        
        const length = inputs[0]?.value || '';
        const width = inputs[1]?.value || '';
        const area = inputs[2]?.value || '';
        const price = inputs[3]?.value || '';
        
        console.log('5. Product measurements:', { length, width, area, price });

        // Get client information
        const clientSection = document.querySelector('.mb-6 .bg-white.rounded-lg.shadow-lg');
        console.log('6. Found client section:', !!clientSection);
        
        if (!clientSection) {
            throw new Error('Client section not found');
        }
        
        // Get all inputs from client section
        const clientInputs = clientSection.querySelectorAll('input, textarea');
        console.log('7. Found client inputs:', clientInputs.length);
        
        const address = clientInputs[2]?.value || '';
        const observation = clientInputs[3]?.value || '';
        
        console.log('8. Client info:', { address, observation });

        // Show the modal
        const modal = document.getElementById('qrModal');
        const container = document.getElementById('qrCodeContainer');
        const productText = document.getElementById('qrModalProduct');
        const phoneText = document.getElementById('qrModalPhone');
        const clientText = document.getElementById('qrModalClient');
        
        // Clear previous QR code if exists
        container.innerHTML = '';
        
        // Update modal content
        productText.textContent = `Product ${productIndex + 1}/${totalProducts}`;
        phoneText.textContent = phone;
        clientText.textContent = clientName;
        
        // Create QR code data
        const qrData = {
            client: {
                name: clientName,
                phone: phone,
                address: address,
                observation: observation
            },
            product: {
                number: `${productIndex + 1}/${totalProducts}`,
                length: length,
                width: width,
                area: area,
                price: price
            }
        };

        // Generate QR code with smaller size
        const qr = new QRCode(container, {
            text: JSON.stringify(qrData),
            width: 192,  // 25% smaller than 256
            height: 192, // 25% smaller than 256
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code: ' + error.message);
    }
}

function closeQRModal() {
    const modal = document.getElementById('qrModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function printQRCodeContent() {
    const printWindow = window.open('', '', 'width=600,height=600');
    const content = document.getElementById('qrCodeContainer').innerHTML;
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Print QR Code</title>
                <style>
                    body { 
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .container {
                        text-align: center;
                    }
                    img {
                        max-width: 200px;
                        height: auto;
                    }
                    p {
                        margin: 8px 0;
                    }
                    /* Workspace header */
                    .space-y-2 p:first-child {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 8px;
                    }
                    /* Product number */
                    .space-y-2 p:nth-child(2) {
                        font-size: 18px;
                        margin: 12px 0;
                    }
                    /* Phone number */
                    .space-y-2 p:nth-child(3) {
                        font-size: 20px;
                        font-weight: bold;
                    }
                    /* Client name */
                    .space-y-2 p:last-child {
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${content}
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function downloadQRCode() {
    const qrImage = document.querySelector('#qrCodeContainer img');
    if (qrImage) {
        const link = document.createElement('a');
        link.download = 'qr-code.png';
        link.href = qrImage.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function scanOldQRCode(materialType, productNumber) {
    // In design mode, we'll simulate scanning with a prompt
    const mockQRData = prompt(`Scan QR Code for ${materialType} #${productNumber} (For demo, paste a JSON string with order data)`);
    
    if (mockQRData) {
        try {
            const orderData = JSON.parse(mockQRData);
            const product = document.querySelectorAll('.product-card')[productNumber - 1];
            
            // Fill in product measurements
            const lengthInput = product.querySelector('input[name="length"]');
            const widthInput = product.querySelector('input[name="width"]');
            const areaInput = product.querySelector('input[name="area"]');
            const priceInput = product.querySelector('input[name="price"]');
            
            lengthInput.value = orderData.product.length;
            widthInput.value = orderData.product.width;
            areaInput.value = orderData.product.area;
            priceInput.value = orderData.product.price;
            
            // Trigger calculations
            updateItemCalculations(product);
            
        } catch (error) {
            alert('Invalid QR code data format');
        }
    }
}

const OrderManager = {
    // Store the current document data
    currentDocument: null,
    currentItemToDelete: null,

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

    // Document modal functions
    async openDocumentModal() {
        try {
            const response = await fetch('/carpet/api/documents/');
            if (!response.ok) throw new Error('Failed to fetch documents');
            const data = await response.json();
            
            // Handle both array and object with results
            const documents = Array.isArray(data) ? data : (data.results || []);
            
            const templatesList = document.getElementById('documentTemplatesList');
            templatesList.innerHTML = documents.map(doc => `
                <div class="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 cursor-pointer transition-colors"
                     onclick="OrderManager.generateDocument('${doc.id}')">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <img src="${doc.template_image}" alt="${doc.name}" 
                                 class="w-20 h-20 object-cover rounded">
                        </div>
                        <div class="ml-4 flex-1">
                            <h3 class="font-medium">${doc.name}</h3>
                            <p class="text-sm text-gray-500 mt-1">${doc.type}</p>
                            <div class="mt-2 text-sm">
                                <span class="text-gray-600">${doc.order_fields.length} order fields</span>
                                <span class="mx-2">•</span>
                                <span class="text-gray-600">${doc.company_fields.length} company fields</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('documentModal').classList.remove('hidden');
        } catch (error) {
            console.error('Error loading documents:', error);
            alert('Failed to load document templates');
        }
    },

    closeDocumentModal() {
        document.getElementById('documentModal').classList.add('hidden');
    },

    closePreviewModal() {
        document.getElementById('documentPreviewModal').classList.add('hidden');
        this.currentDocument = null;
    },

    async generateDocument(documentId) {
        try {
            const orderId = window.location.pathname.split('/').filter(Boolean).pop();
            const response = await fetch(`/carpet/api/documents/${documentId}/generate/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({ order_id: orderId })
            });
            
            if (!response.ok) throw new Error('Failed to generate document');
            const documentData = await response.json();
            
            // Store the current document data
            this.currentDocument = documentData;
            
            // Close the template selection modal
            this.closeDocumentModal();
            
            // Show the preview modal with the generated document
            const previewContainer = document.getElementById('documentPreview');
            previewContainer.innerHTML = this.renderDocument(documentData);
            
            document.getElementById('documentPreviewModal').classList.remove('hidden');
        } catch (error) {
            console.error('Error generating document:', error);
            alert('Failed to generate document');
        }
    },

    renderDocument(data) {
        let html = `
            <div class="space-y-8">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold">${data.name}</h1>
                    <img src="${data.template_image}" alt="Template" class="w-32 h-32 object-contain">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Order Fields -->
                    ${Object.entries(data.fields).map(([key, value]) => `
                        <div class="space-y-1">
                            <label class="text-sm font-medium text-gray-700">${this.formatFieldName(key)}</label>
                            <div class="text-gray-900">
                                ${Array.isArray(value) 
                                    ? this.renderArrayValue(value)
                                    : this.formatValue(value)
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Text Sections -->
                ${data.text_sections.map(section => `
                    <div class="space-y-2">
                        <h3 class="font-medium">${section.id}</h3>
                        <p class="text-gray-600">${section.content}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        return html;
    },

    formatFieldName(key) {
        return key
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/[._]/g, ' ') // Replace dots and underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
    },

    formatValue(value) {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') return value.toLocaleString();
        if (value instanceof Date) return value.toLocaleDateString();
        return value.toString();
    },

    renderArrayValue(array) {
        if (!array.length) return '-';
        return `
            <ul class="list-disc list-inside space-y-1">
                ${array.map(item => `<li>${this.formatValue(item)}</li>`).join('')}
            </ul>
        `;
    },

    downloadDocument() {
        if (!this.currentDocument) return;
        
        // Create a blob from the HTML content
        const html = this.renderDocument(this.currentDocument);
        const blob = new Blob([html], { type: 'text/html' });
        
        // Create a download link and trigger it
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${this.currentDocument.name}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    },

    // Initialize
    init() {
        // Any initialization code can go here
    },

    showDeleteModal(itemId) {
        this.currentItemToDelete = itemId;
        const modal = document.getElementById('deleteConfirmModal');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        confirmBtn.onclick = () => this.deleteItem();
    },

    closeDeleteModal() {
        const modal = document.getElementById('deleteConfirmModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        this.currentItemToDelete = null;
    },

    async deleteItem() {
        if (!this.currentItemToDelete) return;
        
        try {
            const response = await fetch(`/carpet/api/items/${this.currentItemToDelete}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete item');
            }

            // Remove the item from the DOM
            const itemElement = document.querySelector(`[data-item-id="${this.currentItemToDelete}"]`);
            if (itemElement) {
                itemElement.remove();
            }

            // Update totals
            updateOrderTotals();
            
            // Close the modal
            this.closeDeleteModal();
            
            // Update the products count in the header
            const totalItems = document.querySelectorAll('.product-card').length;
            const measuredItems = Array.from(document.querySelectorAll('.product-card')).filter(card => {
                const area = parseFloat(card.querySelector('input[name="area"]').value) || 0;
                return area > 0;
            }).length;
            
            const productsHeader = document.querySelector('.text-lg.font-medium');
            if (productsHeader) {
                productsHeader.textContent = `Products (${measuredItems}/${totalItems})`;
            }

        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item: ' + error.message);
        }
    },

    showAddProductModal() {
        const modal = document.getElementById('addProductModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Reset form
        document.getElementById('addProductForm').reset();

        // Add submit handler
        document.getElementById('addProductForm').onsubmit = (e) => {
            e.preventDefault();
            this.addProduct();
        };
    },

    closeAddProductModal() {
        const modal = document.getElementById('addProductModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    },

    async addProduct() {
        try {
            const materialType = document.getElementById('materialType').value;
            
            // Generate a unique QR code
            const timestamp = new Date().getTime();
            const randomStr = Math.random().toString(36).substring(7);
            const qrCode = `${timestamp}-${randomStr}`;

            const response = await fetch(`/carpet/api/items/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    order: orderId,
                    material_type: materialType,
                    status: 'RECEIVED',
                    dimensions: {
                        width: 0,
                        height: 0,
                        surface: 0
                    },
                    price: 0,
                    qr_code: qrCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to add product');
            }

            // Reload page to show new product
            window.location.reload();

        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product: ' + error.message);
        }
    },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => OrderManager.init());

// Helper function to get CSRF token
function getCookie(name) {
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
}

function calculateSurface(length, width) {
    return (length * width) / 10000; // Convert from cm² to m²
}

// Save changes functionality
async function saveOrderChanges() {
    // Get form values
    const clientData = {
        name: document.getElementById('clientName').value,
        phone: document.getElementById('clientPhone').value,
        address: document.getElementById('clientAddress').value || ''
    };

    const orderData = {
        notes: document.getElementById('orderNotes').value || '',
        price_per_sqm: parseFloat(document.getElementById('pricePerSqm').value) || 0,
        total_price: parseFloat(document.getElementById('totalPrice').value) || 0
    };

    try {
        // Update client
        const clientResponse = await fetch(`/carpet/api/clients/${clientId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(clientData)
        });

        if (!clientResponse.ok) {
            const errorData = await clientResponse.json();
            throw new Error(`Failed to update client: ${JSON.stringify(errorData)}`);
        }

        // Update order
        const orderResponse = await fetch(`/carpet/api/orders/${orderId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            const errorData = await orderResponse.json();
            throw new Error(`Failed to update order: ${JSON.stringify(errorData)}`);
        }

        // Save items
        const items = document.querySelectorAll('.product-card');
        for (const item of items) {
            const itemId = item.dataset.itemId;
            const itemData = {
                dimensions: {
                    width: parseFloat(item.querySelector('[name="length"]').value) || 0,
                    height: parseFloat(item.querySelector('[name="width"]').value) || 0,
                    surface: calculateSurface(
                        parseFloat(item.querySelector('[name="length"]').value) || 0,
                        parseFloat(item.querySelector('[name="width"]').value) || 0
                    )
                },
                price: parseFloat(item.querySelector('[name="price"]').value) || 0
            };

            const itemResponse = await fetch(`/carpet/api/items/${itemId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(itemData)
            });

            if (!itemResponse.ok) {
                const errorData = await itemResponse.json();
                throw new Error(`Failed to update item: ${JSON.stringify(errorData)}`);
            }
        }

        // Redirect to dashboard on success
        window.location.href = '/carpet/dashboard/';

    } catch (error) {
        console.error('Error saving changes:', error);
        alert(`Failed to save changes: ${error.message}`);
    }
}

// Make functions available globally
window.saveOrderChanges = saveOrderChanges;
window.printQRCode = printQRCode;
window.closeQRModal = closeQRModal;
window.printQRCodeContent = printQRCodeContent;
window.downloadQRCode = downloadQRCode;
window.scanOldQRCode = scanOldQRCode;

function calculateItemPrice(length, width, pricePerSqm) {
    const area = (length * width) / 10000; // Convert to square meters
    return area * pricePerSqm;
}

function updateItemCalculations(productCard) {
    const lengthInput = productCard.querySelector('input[name="length"]');
    const widthInput = productCard.querySelector('input[name="width"]');
    const areaInput = productCard.querySelector('input[name="area"]');
    const priceInput = productCard.querySelector('input[name="price"]');
    const pricePerSqm = parseFloat(document.getElementById('pricePerSqm').value) || 0;

    const length = parseFloat(lengthInput.value) || 0;
    const width = parseFloat(widthInput.value) || 0;
    
    // Calculate area
    const area = (length * width) / 10000; // Convert to square meters
    areaInput.value = area.toFixed(2);
    
    // Calculate price
    const price = calculateItemPrice(length, width, pricePerSqm);
    priceInput.value = price.toFixed(2);

    // Update total area and price
    updateOrderTotals();
}

function updateOrderTotals() {
    let totalArea = 0;
    let totalPrice = 0;
    const pricePerSqm = parseFloat(document.getElementById('pricePerSqm').value) || 0;

    document.querySelectorAll('.product-card').forEach(card => {
        const area = parseFloat(card.querySelector('input[name="area"]').value) || 0;
        totalArea += area;
        totalPrice += area * pricePerSqm;
    });

    document.getElementById('totalArea').value = totalArea.toFixed(2);
    document.getElementById('totalPrice').value = totalPrice.toFixed(2);
}

// Update the delete button click handler in the template
document.querySelectorAll('.product-card').forEach(card => {
    const deleteBtn = card.querySelector('[data-tooltip="Delete"]');
    if (deleteBtn) {
        deleteBtn.onclick = () => OrderManager.showDeleteModal(card.dataset.itemId);
    }
}); 