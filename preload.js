const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    addProduct: (product) =>
        ipcRenderer.invoke('add-product', product),

    getProducts: () =>
        ipcRenderer.invoke('get-products'),

    deleteProduct: (id) =>
        ipcRenderer.invoke('delete-product', id),

    updateProduct: (product) =>
        ipcRenderer.invoke('update-product', product),

    addCustomer: (customer) =>
        ipcRenderer.invoke('add-customer', customer),

    getCustomers: () =>
        ipcRenderer.invoke('get-customers'),

    deleteCustomer: (id) =>
        ipcRenderer.invoke('delete-customer', id),
    getCustomers: () =>
        ipcRenderer.invoke('get-customers'),

    getProducts: () =>
        ipcRenderer.invoke('get-products'),

    saveBill: (bill) =>
        ipcRenderer.invoke('save-bill', bill),
    getBills: () =>
        ipcRenderer.invoke('get-bills'),

    deleteBill: (id) =>
        ipcRenderer.invoke('delete-bill', id),
    getBillDetails: (id) =>
        ipcRenderer.invoke('get-bill-details', id),
    printBill: (billId) =>
        ipcRenderer.invoke('print-bill', billId),
    getDashboardStats: () =>
        ipcRenderer.invoke('get-dashboard-stats'),

});