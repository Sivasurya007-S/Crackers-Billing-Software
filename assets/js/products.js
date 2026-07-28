async function saveOrUpdateProduct() {
    const id = document.getElementById('productId').value;
    const code = document.getElementById('code').value.trim();
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value.trim();
    const rate = Number(document.getElementById('rate').value);
    const stock = Number(document.getElementById('stock').value);

    if (!code || !name || !category || isNaN(rate) || isNaN(stock)) {
        alert("Please fill out all fields correctly.");
        return;
    }

    const product = { id, code, name, category, rate, stock };

    try {
        if (id) {
            await window.electronAPI.updateProduct(product);
        } else {
            await window.electronAPI.addProduct(product);
        }

        clearForm();
        loadProducts();
    } catch (err) {
        console.error("Error saving product:", err);
        alert("Failed to save product: " + err.message);
    }
}

async function loadProducts() {
    try {
        const searchValue = document.getElementById("search")?.value.toLowerCase() || "";
        const products = await window.electronAPI.getProducts();

        let html = '';
        const filtered = products.filter(product => {
            return (
                product.product_code.toLowerCase().includes(searchValue) ||
                product.product_name.toLowerCase().includes(searchValue) ||
                product.category.toLowerCase().includes(searchValue)
            );
        });

        if (filtered.length === 0) {
            html = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No products found.
                    </td>
                </tr>
            `;
        } else {
            filtered.forEach(product => {
                let stockBadge = '';
                if (product.stock === 0) {
                    stockBadge = '<span class="badge danger">Out of Stock</span>';
                } else if (product.stock < 10) {
                    stockBadge = `<span class="badge warning">${product.stock} Low Stock</span>`;
                } else {
                    stockBadge = `<span class="badge success">${product.stock} In Stock</span>`;
                }

                html += `
                    <tr>
                        <td>${product.id}</td>
                        <td style="font-weight: 600;">${product.product_code}</td>
                        <td>${product.product_name}</td>
                        <td><span style="background: rgba(255,255,255,0.05); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${product.category}</span></td>
                        <td style="font-weight: 600;">₹ ${Number(product.rate).toFixed(2)}</td>
                        <td>${stockBadge}</td>
                        <td style="text-align: center;">
                            <div style="display: flex; gap: 0.25rem; justify-content: center;">
                                <button class="secondary" onclick="editProduct(${product.id})" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; margin: 0;">Edit</button>
                                <button class="danger" onclick="removeProduct(${product.id})" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; margin: 0;">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        const tableBody = document.getElementById('productTable');
        if (tableBody) {
            tableBody.innerHTML = html;
        }
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

async function removeProduct(id) {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
        await window.electronAPI.deleteProduct(id);
        loadProducts();
    } catch (err) {
        console.error("Error removing product:", err);
    }
}

async function editProduct(id) {
    try {
        const products = await window.electronAPI.getProducts();
        const product = products.find(p => p.id === id);

        if (!product) return;

        document.getElementById('productId').value = product.id;
        document.getElementById('code').value = product.product_code;
        document.getElementById('name').value = product.product_name;
        document.getElementById('category').value = product.category;
        document.getElementById('rate').value = product.rate;
        document.getElementById('stock').value = product.stock;

        // Change card header state
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.innerHTML = '<span>✏️</span> Edit Product';
        }
    } catch (err) {
        console.error("Error editing product:", err);
    }
}

function clearForm() {
    document.getElementById('productId').value = '';
    document.getElementById('code').value = '';
    document.getElementById('name').value = '';
    document.getElementById('category').value = '';
    document.getElementById('rate').value = '';
    document.getElementById('stock').value = '';

    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.innerHTML = '<span>➕</span> Add Product';
    }
}

// Initial load
loadProducts();