async function initDashboard() {
    try {
        const stats = await window.electronAPI.getDashboardStats();

        // Populate stats count
        document.getElementById('statTodaySales').innerText = `₹ ${Number(stats.todaySales || 0).toLocaleString('en-IN')}`;
        document.getElementById('statTodayBills').innerText = stats.todayBills || 0;
        document.getElementById('statTotalCustomers').innerText = stats.totalCustomers || 0;
        document.getElementById('statLowStock').innerText = stats.lowStockProducts || 0;

        // Populate recent bills
        const recentBillsTable = document.getElementById('recentBillsTable');
        if (stats.recentBills && stats.recentBills.length > 0) {
            let html = '';
            stats.recentBills.forEach(bill => {
                const dateStr = new Date(bill.bill_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                html += `
                    <tr>
                        <td style="font-weight: 600; color: var(--primary-color);">${bill.bill_no}</td>
                        <td>${bill.customer_name || 'Walk-in Customer'}</td>
                        <td>${dateStr}</td>
                        <td style="font-weight: 700;">₹ ${bill.grand_total}</td>
                    </tr>
                `;
            });
            recentBillsTable.innerHTML = html;
        } else {
            recentBillsTable.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No invoices generated today.
                    </td>
                </tr>
            `;
        }

        // Fetch product list to find low stock names
        const products = await window.electronAPI.getProducts();
        const lowStockList = document.getElementById('lowStockList');
        const lowStockProducts = products.filter(p => p.stock < 10);

        if (lowStockProducts.length > 0) {
            let html = '';
            lowStockProducts.forEach(p => {
                const badgeClass = p.stock === 0 ? 'badge danger' : 'badge warning';
                const badgeText = p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} LEFT`;
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid var(--border-light);">
                        <div>
                            <div style="font-weight: 600; font-size: 0.9rem;">${p.product_name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.product_code}</div>
                        </div>
                        <span class="${badgeClass}">${badgeText}</span>
                    </div>
                `;
            });
            lowStockList.innerHTML = html;
        } else {
            lowStockList.innerHTML = `
                <div style="text-align: center; color: #10b981; padding: 1.5rem; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <span>✅</span> All products are fully stocked!
                </div>
            `;
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
}

// Start
initDashboard();
