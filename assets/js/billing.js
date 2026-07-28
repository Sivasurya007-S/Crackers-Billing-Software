let bill = [];
let selectedProduct = null;
let lastBillId = null;

// Product search and selection
async function searchProductAutoComplete() {
    const keyword = document.getElementById("productSearch").value.toLowerCase().trim();
    const suggestionsEl = document.getElementById("suggestions");

    if (keyword === "") {
        suggestionsEl.innerHTML = "";
        return;
    }

    try {
        const products = await window.electronAPI.getProducts();
        let html = "";

        const filtered = products.filter(p =>
            p.product_code.toLowerCase().includes(keyword) ||
            p.product_name.toLowerCase().includes(keyword)
        );

        if (filtered.length === 0) {
            html = `<div class="suggestion-item" style="color: var(--text-muted); cursor: default;">No matching products</div>`;
        } else {
            filtered.forEach(p => {
                html += `
                <div class="suggestion-item" onclick="selectProduct(${p.id})">
                    <span style="font-weight: 600; color: var(--primary-color);">${p.product_code}</span> - ${p.product_name} 
                    <span style="font-size: 0.8rem; color: var(--text-muted);">(${p.stock} left)</span>
                </div>
                `;
            });
        }
        suggestionsEl.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

async function selectProduct(id) {
    try {
        const products = await window.electronAPI.getProducts();
        selectedProduct = products.find(p => p.id == id);

        if (!selectedProduct) return;

        document.getElementById("productSearch").value = selectedProduct.product_code;
        document.getElementById("productName").value = selectedProduct.product_name;
        document.getElementById("rate").value = selectedProduct.rate;
        document.getElementById("stock").value = selectedProduct.stock;
        document.getElementById("qty").value = 1; // Default to 1

        document.getElementById("suggestions").innerHTML = "";
        document.getElementById("qty").focus();
    } catch (err) {
        console.error(err);
    }
}

// Customer search and selection
async function searchCustomerAutoComplete() {
    const keyword = document.getElementById("customerSearch").value.toLowerCase().trim();
    const suggestionsEl = document.getElementById("customerSuggestions");

    if (keyword === "") {
        suggestionsEl.innerHTML = "";
        return;
    }

    try {
        const customers = await window.electronAPI.getCustomers();
        let html = "";

        const filtered = customers.filter(c =>
            c.customer_name.toLowerCase().includes(keyword) ||
            c.phone.includes(keyword)
        );

        if (filtered.length === 0) {
            html = `<div class="suggestion-item" style="color: var(--text-muted); cursor: default;">No matching customers</div>`;
        } else {
            filtered.forEach(c => {
                html += `
                <div class="suggestion-item" onclick="selectCustomer(${c.id}, '${c.customer_name}', '${c.phone}')">
                    <span style="font-weight: 600;">${c.customer_name}</span> - 📞 ${c.phone}
                </div>
                `;
            });
        }
        suggestionsEl.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

function selectCustomer(id, name, phone) {
    document.getElementById("customerId").value = id;
    document.getElementById("customerSearch").value = `${name} (${phone})`;
    document.getElementById("customerNameSpan").innerText = `${name} | ID: ${id}`;

    document.getElementById("selectedCustomerInfo").style.display = "block";
    document.getElementById("customerSuggestions").innerHTML = "";

    // Focus on product search
    document.getElementById("productSearch").focus();
}

function addItem() {
    if (!selectedProduct) {
        alert("Please select a product first.");
        return;
    }

    const qty = Number(document.getElementById("qty").value);

    if (isNaN(qty) || qty <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (qty > selectedProduct.stock) {
        alert(`Insufficient stock! Available quantity is ${selectedProduct.stock}.`);
        return;
    }

    const amount = qty * selectedProduct.rate;

    // Check if item already exists in bill
    const existingItemIndex = bill.findIndex(item => item.productId === selectedProduct.id);
    if (existingItemIndex > -1) {
        bill[existingItemIndex].qty += qty;
        bill[existingItemIndex].amount += amount;
    } else {
        bill.push({
            productId: selectedProduct.id,
            productCode: selectedProduct.product_code,
            productName: selectedProduct.product_name,
            qty: qty,
            rate: selectedProduct.rate,
            amount: amount
        });
    }

    // Reset product fields
    selectedProduct = null;
    document.getElementById("productSearch").value = "";
    document.getElementById("productName").value = "";
    document.getElementById("rate").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("qty").value = "";

    renderBill();
}

function renderBill() {
    let html = "";
    let subtotal = 0;

    if (bill.length === 0) {
        html = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    No items added yet. Search and add a product.
                </td>
            </tr>
        `;
        // Reset discount preview when bill is empty
        const discountLabel = document.getElementById('discountAmountLabel');
        if (discountLabel) discountLabel.innerText = '';
    } else {
        bill.forEach((item, index) => {
            subtotal += item.amount;
            html += `
            <tr>
                <td style="font-weight: 600; color: var(--primary-color);">${item.productCode}</td>
                <td>${item.productName}</td>
                <td style="text-align: center;">₹ ${item.rate.toFixed(2)}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right; font-weight: 600;">₹ ${item.amount.toFixed(2)}</td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 0.25rem; justify-content: center;">
                        <button class="secondary" onclick="editItem(${index})" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin: 0;">Edit</button>
                        <button class="danger" onclick="deleteItem(${index})" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin: 0;">Delete</button>
                    </div>
                </td>
            </tr>
            `;
        });
    }

    document.getElementById("billItems").innerHTML = html;

    // Percentage-based discount
    const discountPct = Math.min(100, Math.max(0, Number(document.getElementById("discount").value || 0)));
    const discountAmt = Math.round((discountPct / 100) * subtotal * 100) / 100;
    const total = Math.max(0, subtotal - discountAmt);

    // Update savings preview label
    const discountLabel = document.getElementById('discountAmountLabel');
    if (discountLabel) {
        discountLabel.innerText = discountPct > 0
            ? `You save ₹ ${discountAmt.toLocaleString('en-IN')}`
            : '';
    }

    document.getElementById("subtotal").innerText = subtotal.toLocaleString('en-IN');
    document.getElementById("total").innerText = total.toLocaleString('en-IN');
}

function editItem(index) {
    const item = bill[index];

    document.getElementById("productSearch").value = item.productCode;
    document.getElementById("productName").value = item.productName;
    document.getElementById("rate").value = item.rate;
    document.getElementById("qty").value = item.qty;

    // Fetch stock info again
    selectedProduct = {
        id: item.productId,
        product_code: item.productCode,
        product_name: item.productName,
        rate: item.rate,
        stock: 999999 // fallback high stock so edit doesn't fail immediately
    };

    // Re-verify actual stock from list
    window.electronAPI.getProducts().then(products => {
        const prodObj = products.find(p => p.id == item.productId);
        if (prodObj) {
            selectedProduct.stock = prodObj.stock + item.qty; // include currently billed qty back into pool
            document.getElementById("stock").value = selectedProduct.stock;
        }
    });

    bill.splice(index, 1);
    renderBill();
}

function deleteItem(index) {
    bill.splice(index, 1);
    renderBill();
}

async function saveBill() {
    const customerId = document.getElementById("customerId").value;
    const subtotal = Number(document.getElementById("subtotal").innerText.replace(/,/g, ''));
    const total = Number(document.getElementById("total").innerText.replace(/,/g, ''));
    const discountPct = Math.min(100, Math.max(0, Number(document.getElementById("discount").value || 0)));
    const discountAmt = Math.round((discountPct / 100) * subtotal * 100) / 100;

    if (!customerId) {
        alert("Please search and assign a customer first.");
        return;
    }

    if (bill.length === 0) {
        alert("Cannot save empty invoice. Add items first.");
        return;
    }

    try {
        const result = await window.electronAPI.saveBill({
            customerId: Number(customerId),
            subtotal,
            discountAmt,
            total,
            items: bill
        });

        lastBillId = result.billId;

        // Celebratory Fireworks
        launchFireworks();

        alert(`Invoice Saved Successfully!\nInvoice No: ${result.billNo}`);

        // Reset all states
        bill = [];
        document.getElementById("customerId").value = "";
        document.getElementById("customerSearch").value = "";
        document.getElementById("selectedCustomerInfo").style.display = "none";
        document.getElementById("discount").value = "0";
        renderBill();
    } catch (err) {
        console.error(err);
        alert("Error saving invoice: " + err.message);
    }
}

async function printBill() {
    if (!lastBillId) {
        alert("No active bill. Please save a bill first before printing.");
        return;
    }

    try {
        await window.electronAPI.printBill(lastBillId);
        alert("Invoice PDF created successfully under pdf/ folder!");
    } catch (err) {
        console.error(err);
        alert("Error printing PDF: " + err.message);
    }
}

// Celebration Fireworks Canvas Particles Animation
function launchFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const colors = ['#ff5f6d', '#ffc371', '#00f2fe', '#10b981', '#f59e0b', '#ec4899'];

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = Math.random() * 5 + 2;
            this.friction = 0.95;
            this.gravity = 0.12;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.012;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }
        update() {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    function explode(x, y) {
        for (let i = 0; i < 45; i++) {
            particles.push(new Particle(x, y));
        }
    }

    explode(canvas.width / 2, canvas.height / 3);
    setTimeout(() => explode(canvas.width / 3, canvas.height / 2), 250);
    setTimeout(() => explode(canvas.width * 2 / 3, canvas.height / 2), 450);

    let animationFrame;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        if (particles.length > 0) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
            cancelAnimationFrame(animationFrame);
        }
    }
    animate();
}