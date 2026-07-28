async function saveCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();

    if (!name || !phone) {
        alert("Please enter at least Name and Phone Number.");
        return;
    }

    const customer = { name, phone, address };

    try {
        await window.electronAPI.addCustomer(customer);

        // Clear form fields
        document.getElementById('customerName').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('address').value = '';

        loadCustomers();
    } catch (err) {
        console.error("Error saving customer:", err);
        alert("Failed to save customer: " + err.message);
    }
}

async function loadCustomers() {
    try {
        const search = document.getElementById('searchCustomer')?.value.toLowerCase() || '';
        const customers = await window.electronAPI.getCustomers();

        let html = '';
        const filtered = customers.filter(customer => {
            return (
                customer.customer_name.toLowerCase().includes(search) ||
                customer.phone.toLowerCase().includes(search) ||
                (customer.address && customer.address.toLowerCase().includes(search))
            );
        });

        if (filtered.length === 0) {
            html = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No customers found in directory.
                    </td>
                </tr>
            `;
        } else {
            filtered.forEach(customer => {
                html += `
                    <tr>
                        <td>${customer.id}</td>
                        <td style="font-weight: 600;">${customer.customer_name}</td>
                        <td>📞 ${customer.phone}</td>
                        <td>${customer.address || '<span style="color: var(--text-muted); font-style: italic;">No address</span>'}</td>
                        <td style="text-align: center;">
                            <button class="danger" onclick="removeCustomer(${customer.id})" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; margin: 0;">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        const tableBody = document.getElementById('customerTable');
        if (tableBody) {
            tableBody.innerHTML = html;
        }
    } catch (err) {
        console.error("Error loading customers:", err);
    }
}

async function removeCustomer(id) {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
        await window.electronAPI.deleteCustomer(id);
        loadCustomers();
    } catch (err) {
        console.error("Error deleting customer:", err);
    }
}

// Boot up loading
loadCustomers();