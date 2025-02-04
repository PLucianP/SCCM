// Create Order Modal
function openCreateModal() {
    const modal = document.getElementById('createOrderModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCreateModal() {
    const modal = document.getElementById('createOrderModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function submitNewOrder() {
    // Get form values
    const clientName = document.getElementById('clientName').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const workspace = document.getElementById('workspace').value;
    const productCount = parseInt(document.getElementById('productCount').value) || 1;

    // Validate required fields
    if (!clientName || !clientPhone || !workspace) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        // First create the client
        const clientResponse = await fetch('/carpet/api/clients/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                workspace: workspace,
                name: clientName,
                phone: clientPhone,
                address: clientAddress || ''  // Send empty string instead of null
            })
        });

        // Get detailed error message if request fails
        if (!clientResponse.ok) {
            const errorData = await clientResponse.json();
            console.error('Client creation error details:', errorData);
            throw new Error(`Failed to create client: ${JSON.stringify(errorData)}`);
        }

        const client = await clientResponse.json();

        // Then create the order
        const orderResponse = await fetch('/carpet/api/orders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                workspace: workspace,
                client: client.id,
                status: 'NEW',
                priority: 'MEDIUM',
                notes: '',
                qr_code: generateQRCode()
            })
        });

        // Get detailed error message if request fails
        if (!orderResponse.ok) {
            const errorData = await orderResponse.json();
            console.error('Order creation error details:', errorData);
            throw new Error(`Failed to create order: ${JSON.stringify(errorData)}`);
        }

        const order = await orderResponse.json();

        // Create the specified number of items
        const itemPromises = Array(productCount).fill().map(() => 
            fetch('/carpet/api/items/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    order: order.id,
                    material_type: 'CARPET',
                    status: 'RECEIVED',
                    dimensions: {},  // Empty dimensions for new items
                    price: 0,
                    qr_code: generateQRCode()
                })
            })
        );

        try {
            const itemResponses = await Promise.all(itemPromises);
            
            // Check if any item creation failed
            for (const response of itemResponses) {
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Item creation error details:', errorData);
                    throw new Error(`Failed to create item: ${JSON.stringify(errorData)}`);
                }
            }
        } catch (error) {
            console.error('Error creating items:', error);
            throw new Error('Failed to create one or more items');
        }

        // Close modal and reload page to show new order
        closeCreateModal();
        window.location.reload();

    } catch (error) {
        console.error('Error creating order:', error);
        // Show a more detailed error message to the user
        alert(`Failed to create order: ${error.message}`);
    }
}

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

// Helper function to generate a unique QR code
function generateQRCode() {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

let orderToDelete = null;

function openDeleteModal(orderId) {
    orderToDelete = orderId;
    const modal = document.getElementById('deleteConfirmModal');
    modal.classList.remove('hidden');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    modal.classList.add('hidden');
    orderToDelete = null;
}

// Delete Order
async function deleteOrder() {
    if (!orderToDelete) return;
    
    try {
        const response = await fetch(`/carpet/api/orders/${orderToDelete}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete order');
        }

        // Remove the card from DOM
        const orderCard = document.querySelector(`[data-order-id="${orderToDelete}"]`);
        if (orderCard) {
            orderCard.remove();
            
            // Update stats counters
            const totalOrdersElement = document.querySelector('[data-stat="total_orders"]');
            const newOrdersElement = document.querySelector('[data-stat="new_orders"]');
            const activeOrdersElement = document.querySelector('[data-stat="active_orders"]');
            
            if (totalOrdersElement) {
                const currentTotal = parseInt(totalOrdersElement.textContent);
                totalOrdersElement.textContent = currentTotal - 1;
            }
            
            // Check if it was a new order
            const isNewOrder = orderCard.getAttribute('data-status') === 'NEW';
            if (isNewOrder && newOrdersElement) {
                const currentNew = parseInt(newOrdersElement.textContent);
                newOrdersElement.textContent = currentNew - 1;
            }
            
            // Check if it was an active order
            const isActiveOrder = ['NEW', 'WIP'].includes(orderCard.getAttribute('data-status'));
            if (isActiveOrder && activeOrdersElement) {
                const currentActive = parseInt(activeOrdersElement.textContent);
                activeOrdersElement.textContent = currentActive - 1;
            }
        }
        
        closeDeleteModal();

    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
    }
}

// Make functions available globally
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.submitNewOrder = submitNewOrder;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.deleteOrder = deleteOrder; 