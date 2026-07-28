let billsList = [];

async function loadBills() {
    try {
        const search = document.getElementById("search")?.value.toLowerCase() || "";
        billsList = await window.electronAPI.getBills();

        let html = "";
        const filtered = billsList.filter(bill => {
            return (
                (bill.bill_no || '').toLowerCase().includes(search) ||
                (bill.customer_name || '').toLowerCase().includes(search)
            );
        });

        if (filtered.length === 0) {
            html = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No invoices found.
                    </td>
                </tr>
            `;
        } else {
            filtered.forEach(bill => {
                const dateStr = new Date(bill.bill_date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                html += `
                <tr>
                    <td style="font-weight: 600; color: var(--primary-color);">${bill.bill_no || '—'}</td>
                    <td>${dateStr}</td>
                    <td>${bill.customer_name || '<span style="color: var(--text-muted); font-style: italic;">Walk-in</span>'}</td>
                    <td style="text-align: right; font-weight: 700;">₹ ${bill.grand_total.toLocaleString('en-IN')}</td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 0.25rem; justify-content: center;">
                            <button class="secondary" onclick="viewBill(${bill.id})" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; margin: 0;">View</button>
                            <button class="danger" onclick="deleteBill(${bill.id})" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; margin: 0;">Delete</button>
                        </div>
                    </td>
                </tr>
                `;
            });
        }

        const tableBody = document.getElementById("billTable");
        if (tableBody) {
            tableBody.innerHTML = html;
        }
    } catch (err) {
        console.error("Error loading bills:", err);
    }
}

async function viewBill(id) {
    try {
        const bill = billsList.find(b => b.id === id);
        if (!bill) return;

        const items = await window.electronAPI.getBillDetails(id);

        // Populate modal headers
        document.getElementById("modalBillNo").innerText = `Invoice details: ${bill.bill_no}`;

        // Build printable bill receipt layout
        const dateStr = new Date(bill.bill_date).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        let itemsHtml = '';
        items.forEach((item, index) => {
            itemsHtml += `
                <tr>
                    <td>${index + 1}. ${item.product_name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: center;">₹ ${item.rate.toFixed(2)}</td>
                    <td style="text-align: right;">₹ ${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });

        const contentEl = document.getElementById("invoiceModalContent");
        contentEl.innerHTML = `
            <h2>🎇 SPARKLER FIREWORKS 🎇</h2>
            <p style="text-align: center; font-size: 0.75rem; margin-top: -0.5rem; margin-bottom: 1rem;">Offline Premium Crackers Invoice</p>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 1rem;">
                <div>
                    <p><strong>Bill No:</strong> ${bill.bill_no}</p>
                    <p><strong>Date:</strong> ${dateStr}</p>
                </div>
                <div style="text-align: right;">
                    <p><strong>Customer:</strong> ${bill.customer_name || 'Walk-in'}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 0.25rem 0;">Item Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: center;">Rate</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 1rem; border-top: 1px dashed #cbd5e1; padding-top: 0.5rem;">
                <p>Subtotal: ₹ ${bill.subtotal.toFixed(2)}</p>
                <p>Discount: ₹ ${bill.discount.toFixed(2)}</p>
                <h3 style="font-size: 1.25rem; font-weight: bold; margin-top: 0.25rem; color: #0f172a;">Grand Total: ₹ ${bill.grand_total.toFixed(2)}</h3>
            </div>
            
            <div style="text-align: center; margin-top: 2rem; font-size: 0.75rem; border-top: 2px dashed #cbd5e1; padding-top: 0.75rem;">
                THANK YOU FOR YOUR PATRONAGE!<br>🎆 Have a safe and happy celebration! 🎇
            </div>
        `;

        // Bind PDF export button
        const exportBtn = document.getElementById("btnPrintModalPdf");
        exportBtn.onclick = async () => {
            try {
                await window.electronAPI.printBill(id);
                alert("PDF exported successfully in the pdf/ directory!");
            } catch (err) {
                alert("Failed to export PDF: " + err.message);
            }
        };

        // Show Modal
        document.getElementById("invoiceModal").classList.add("active");
    } catch (err) {
        console.error("Error opening bill details:", err);
    }
}

function closeInvoiceModal() {
    document.getElementById("invoiceModal").classList.remove("active");
}

async function deleteBill(id) {
    if (!confirm("Are you sure you want to delete this bill record from database? This cannot be undone.")) return;
    try {
        await window.electronAPI.deleteBill(id);
        loadBills();
    } catch (err) {
        console.error("Error deleting bill:", err);
    }
}

// Initial Load
loadBills();

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById("invoiceModal");
    if (event.target === modal) {
        closeInvoiceModal();
    }
});