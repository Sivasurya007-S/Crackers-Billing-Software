const PDFDocument = require('pdfkit');
const fs = require('fs');
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const db = require('./backend/db');

function createWindow() {

    const win = new BrowserWindow({
        width: 1200,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('pages/login.html');
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

ipcMain.handle('add-product', async (event, product) => {

    return new Promise((resolve, reject) => {

        db.run(
            `INSERT INTO products
            (product_code, product_name, category, rate, stock)
            VALUES (?, ?, ?, ?, ?)`,
            [
                product.code,
                product.name,
                product.category,
                product.rate,
                product.stock
            ],
            function (err) {

                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }

            }
        );

    });

});

ipcMain.handle('get-products', async () => {

    return new Promise((resolve, reject) => {

        db.all(
            `SELECT * FROM products`,
            [],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }
        );

    });

});

ipcMain.handle('delete-product', async (event, id) => {

    return new Promise((resolve, reject) => {

        db.run(
            `DELETE FROM products WHERE id = ?`,
            [id],
            function (err) {

                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }

            }
        );

    });

});
ipcMain.handle('update-product', async (event, product) => {

    return new Promise((resolve, reject) => {

        db.run(
            `UPDATE products
             SET product_code=?,
                 product_name=?,
                 category=?,
                 rate=?,
                 stock=?
             WHERE id=?`,
            [
                product.code,
                product.name,
                product.category,
                product.rate,
                product.stock,
                product.id
            ],
            function (err) {

                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }

            }
        );

    });

});
ipcMain.handle('add-customer', async (event, customer) => {

    return new Promise((resolve, reject) => {

        db.run(
            `INSERT INTO customers
            (customer_name, phone, address)
            VALUES (?, ?, ?)`,
            [
                customer.name,
                customer.phone,
                customer.address
            ],
            function (err) {

                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }

            }
        );

    });

});

ipcMain.handle('get-customers', async () => {

    return new Promise((resolve, reject) => {

        db.all(
            `SELECT * FROM customers`,
            [],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }
        );

    });

});

ipcMain.handle('delete-customer', async (event, id) => {

    return new Promise((resolve, reject) => {

        db.run(
            `DELETE FROM customers WHERE id=?`,
            [id],
            function (err) {

                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }

            }
        );

    });

}); ipcMain.handle('save-bill', async (event, billData) => {

    return new Promise((resolve, reject) => {

        const billNo =
            `CRK${new Date().getFullYear()}-${Date.now()}`;

        db.run(
            `INSERT INTO bills
            (
                bill_no,
                customer_id,
                bill_date,
                subtotal,
                discount,
                grand_total
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                billNo,
                billData.customerId,
                new Date().toISOString(),
                billData.subtotal || billData.total,
                billData.discountAmt || 0,
                billData.total
            ],
            function (err) {

                if (err) {
                    reject(err);
                    return;
                }

                const billId = this.lastID;

                billData.items.forEach(item => {

                    db.run(
                        `INSERT INTO bill_items
                        (
                            bill_id,
                            product_id,
                            quantity,
                            rate,
                            amount
                        )
                        VALUES (?, ?, ?, ?, ?)`,
                        [
                            billId,
                            item.productId,
                            item.qty,
                            item.rate,
                            item.amount
                        ]
                    );

                    db.run(
                        `UPDATE products
                         SET stock = stock - ?
                         WHERE id = ?`,
                        [
                            item.qty,
                            item.productId
                        ]
                    );

                });

                resolve({
                    success: true,
                    billId: billId,
                    billNo: billNo
                });

            }
        );

    });

});
ipcMain.handle('get-bills', async () => {

    return new Promise((resolve, reject) => {

        db.all(

            `SELECT
                bills.*,
                customers.customer_name
             FROM bills
             LEFT JOIN customers
             ON bills.customer_id =
                customers.id
             ORDER BY bills.id DESC`,

            [],

            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }

        );

    });

});

ipcMain.handle('delete-bill', async (event, id) => {

    return new Promise((resolve, reject) => {

        db.run(
            `DELETE FROM bills
             WHERE id=?`,
            [id],
            function (err) {

                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }

            }
        );

    });

});
ipcMain.handle('get-bill-details', async (event, billId) => {

    return new Promise((resolve, reject) => {

        db.all(

            `SELECT
                bill_items.*,
                products.product_name
             FROM bill_items
             LEFT JOIN products
             ON bill_items.product_id = products.id
             WHERE bill_items.bill_id = ?`,

            [billId],

            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }

        );

    });

});
ipcMain.handle('print-bill', async (event, billId) => {

    return new Promise((resolve, reject) => {

        db.get(
            `SELECT *
             FROM bills
             WHERE id = ?`,
            [billId],
            (err, bill) => {

                if (err || !bill) {
                    reject(err);
                    return;
                }

                db.all(
                    `SELECT
                        bill_items.*,
                        products.product_name
                     FROM bill_items
                     LEFT JOIN products
                     ON bill_items.product_id = products.id
                     WHERE bill_items.bill_id = ?`,
                    [billId],
                    (err, items) => {

                        if (err) {
                            reject(err);
                            return;
                        }

                        const doc = new PDFDocument({ margin: 50 });
                        const filePath = `pdf/Bill_${bill.bill_no}.pdf`;

                        // Ensure directory exists
                        if (!fs.existsSync('pdf')) {
                            fs.mkdirSync('pdf');
                        }

                        doc.pipe(fs.createWriteStream(filePath));

                        // Header Brand Text
                        doc.fontSize(22)
                            .fillColor('#ff5f6d')
                            .text('SPARKLER FIREWORKS', { align: 'center' });

                        doc.fontSize(9)
                            .fillColor('#64748b')
                            .text('Offline Premium POS Terminal Billing Copy', { align: 'center' });

                        doc.moveDown(1.5);

                        // Separator line
                        doc.moveTo(50, doc.y)
                            .lineTo(550, doc.y)
                            .strokeColor('#cbd5e1')
                            .lineWidth(1)
                            .stroke();

                        doc.moveDown(0.8);

                        // Bill Details Meta
                        const dateFormatted = new Date(bill.bill_date).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });

                        const currentY = doc.y;
                        doc.fontSize(10).fillColor('#1e293b');
                        doc.text(`Invoice No: ${bill.bill_no}`, 50, currentY);
                        doc.text(`Date Issued: ${dateFormatted}`, 320, currentY, { align: 'right', width: 230 });
                        doc.moveDown(1.5);

                        // Table Header Column Labels
                        doc.fontSize(9).fillColor('#475569');
                        const headerY = doc.y;
                        doc.text('Item Description', 50, headerY, { width: 240 });
                        doc.text('Quantity', 290, headerY, { width: 80, align: 'center' });
                        doc.text('Unit Rate', 370, headerY, { width: 90, align: 'center' });
                        doc.text('Subtotal', 460, headerY, { width: 90, align: 'right' });

                        doc.moveDown(0.5);
                        doc.moveTo(50, doc.y)
                            .lineTo(550, doc.y)
                            .strokeColor('#cbd5e1')
                            .lineWidth(0.5)
                            .stroke();
                        doc.moveDown(0.8);

                        // Render Billing Items List
                        doc.fontSize(9).fillColor('#1e293b');
                        items.forEach(item => {
                            const itemY = doc.y;
                            doc.text(item.product_name, 50, itemY, { width: 240 });
                            doc.text(String(item.quantity), 290, itemY, { width: 80, align: 'center' });
                            doc.text(`Rs. ${Number(item.rate).toFixed(2)}`, 370, itemY, { width: 90, align: 'center' });
                            doc.text(`Rs. ${Number(item.amount).toFixed(2)}`, 460, itemY, { width: 90, align: 'right' });
                            doc.moveDown(1);
                        });

                        doc.moveDown(0.5);
                        doc.moveTo(50, doc.y)
                            .lineTo(550, doc.y)
                            .strokeColor('#cbd5e1')
                            .lineWidth(0.5)
                            .stroke();
                        doc.moveDown(0.8);

                        // Totals Summary Pane
                        const totalsY = doc.y;
                        doc.fontSize(9).fillColor('#475569');
                        doc.text('Subtotal amount:', 320, totalsY, { width: 140, align: 'right' });
                        doc.text(`Rs. ${Number(bill.subtotal).toFixed(2)}`, 460, totalsY, { width: 90, align: 'right' });

                        doc.moveDown(0.8);
                        const discountY = doc.y;
                        doc.text('Discounts applied:', 320, discountY, { width: 140, align: 'right' });
                        doc.text(`- Rs. ${Number(bill.discount).toFixed(2)}`, 460, discountY, { width: 90, align: 'right' });

                        doc.moveDown(1.2);
                        const grandY = doc.y;
                        doc.fontSize(11).fillColor('#ff5f6d').font('Helvetica-Bold');
                        doc.text('Invoice Grand Total:', 320, grandY, { width: 140, align: 'right' });
                        doc.text(`Rs. ${Number(bill.grand_total).toFixed(2)}`, 460, grandY, { width: 90, align: 'right' });

                        doc.font('Helvetica'); // reset font style

                        // Footer Note
                        doc.moveDown(4);
                        doc.fontSize(9).fillColor('#64748b')
                            .text('Thank you for shopping at Sparkler Fireworks!', { align: 'center' })
                            .text('Always handle crackers safely. Have a wonderful celebration!', { align: 'center' });

                        doc.end();

                        resolve(true);

                    }
                );

            }
        );

    });

});

ipcMain.handle('get-dashboard-stats', async () => {

    return new Promise((resolve, reject) => {

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}%`;

        const stats = {
            todaySales: 0,
            todayBills: 0,
            totalCustomers: 0,
            totalProducts: 0,
            lowStockProducts: 0,
            recentBills: []
        };

        db.get(
            `SELECT SUM(grand_total) as totalSales, COUNT(id) as totalBills 
             FROM bills 
             WHERE bill_date LIKE ?`,
            [todayStr],
            (err, row1) => {

                if (err) {
                    reject(err);
                    return;
                }

                stats.todaySales = row1.totalSales || 0;
                stats.todayBills = row1.totalBills || 0;

                db.get(
                    `SELECT COUNT(id) as totalCustomers FROM customers`,
                    [],
                    (err, row2) => {

                        if (err) {
                            reject(err);
                            return;
                        }

                        stats.totalCustomers = row2.totalCustomers || 0;

                        db.get(
                            `SELECT COUNT(id) as totalProducts, 
                                    SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as lowStock 
                             FROM products`,
                            [],
                            (err, row3) => {

                                if (err) {
                                    reject(err);
                                    return;
                                }

                                stats.totalProducts = row3.totalProducts || 0;
                                stats.lowStockProducts = row3.lowStock || 0;

                                db.all(
                                    `SELECT bills.*, customers.customer_name 
                                     FROM bills 
                                     LEFT JOIN customers ON bills.customer_id = customers.id 
                                     ORDER BY bills.id DESC 
                                     LIMIT 5`,
                                    [],
                                    (err, rows) => {

                                        if (err) {
                                            reject(err);
                                            return;
                                        }

                                        stats.recentBills = rows || [];
                                        resolve(stats);

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    });

});