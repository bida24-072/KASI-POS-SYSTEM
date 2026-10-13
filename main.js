/* ============================================
   KASI POS SYSTEM — Core Logic
============================================ */

/* ============================================
   DEFAULT PRODUCTS (loaded on first run)
============================================ */
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Coca-Cola 500ml", category: "drinks", price: 8.50, emoji: "🥤", stock: 48 },
    { id: 2, name: "Fanta Orange 500ml", category: "drinks", price: 8.50, emoji: "🍊", stock: 36 },
    { id: 3, name: "Still Water 500ml", category: "drinks", price: 6.00, emoji: "💧", stock: 60 },
    { id: 4, name: "St Louis Lager", category: "drinks", price: 15.00, emoji: "🍺", stock: 24 },
    { id: 5, name: "Castle Lite", category: "drinks", price: 15.00, emoji: "🍺", stock: 18 },
    { id: 6, name: "Bread (White Loaf)", category: "food", price: 12.00, emoji: "🍞", stock: 20 },
    { id: 7, name: "Milk 500ml", category: "food", price: 14.50, emoji: "🥛", stock: 15 },
    { id: 8, name: "Eggs (6 pack)", category: "food", price: 25.00, emoji: "🥚", stock: 12 },
    { id: 9, name: "Chips — Nik Naks", category: "snacks", price: 10.00, emoji: "🥔", stock: 40 },
    { id: 10, name: "Simba Peanuts", category: "snacks", price: 12.00, emoji: "🥜", stock: 30 },
    { id: 11, name: "Chocolate Bar", category: "snacks", price: 15.00, emoji: "🍫", stock: 25 },
    { id: 12, name: "Airtime — P10 Orange", category: "airtime", price: 10.00, emoji: "📱", stock: 999 },
    { id: 13, name: "Airtime — P10 Mascom", category: "airtime", price: 10.00, emoji: "📱", stock: 999 },
    { id: 14, name: "Airtime — P5 BTC", category: "airtime", price: 5.00, emoji: "📱", stock: 999 },
    { id: 15, name: "Toilet Paper (2-ply)", category: "household", price: 15.00, emoji: "🧻", stock: 22 },
    { id: 16, name: "Matches (box)", category: "household", price: 5.00, emoji: "🔥", stock: 45 },
    { id: 17, name: "Candles (pack)", category: "household", price: 18.00, emoji: "🕯️", stock: 10 },
    { id: 18, name: "Soap Bar", category: "household", price: 12.00, emoji: "🧼", stock: 30 },
    { id: 19, name: "Cooking Oil 750ml", category: "food", price: 35.00, emoji: "🫒", stock: 8 },
    { id: 20, name: "Rice 1kg", category: "food", price: 22.00, emoji: "🍚", stock: 14 }
];

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "drinks", label: "Drinks" },
    { id: "food", label: "Food" },
    { id: "snacks", label: "Snacks" },
    { id: "airtime", label: "Airtime" },
    { id: "household", label: "Household" }
];

/* ============================================
   STORAGE
============================================ */
const STORAGE_KEY = "kasiPosData";

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return {
            products: [...DEFAULT_PRODUCTS],
            sales: []
        };
    }
    try { return JSON.parse(raw); }
    catch { return { products: [...DEFAULT_PRODUCTS], sales: [] }; }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let store = loadData();
let cart = [];
let activeCategory = "all";
let searchTerm = "";

/* ============================================
   POS PAGE — Render
============================================ */
function renderCategories() {
    const el = document.getElementById("categories");
    if (!el) return;
    el.innerHTML = "";
    CATEGORIES.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "cat-btn" + (cat.id === activeCategory ? " active" : "");
        btn.textContent = cat.label;
        btn.onclick = () => { activeCategory = cat.id; renderCategories(); renderProducts(); };
        el.appendChild(btn);
    });
}

function renderProducts() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    let list = [...store.products];
    if (activeCategory !== "all") list = list.filter(p => p.category === activeCategory);
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q));
    }

    grid.innerHTML = "";

    if (list.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--muted); padding: 60px 20px; font-family: var(--mono); font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase;">No products found</p>`;
        return;
    }

    list.forEach(p => {
        const out = p.stock <= 0;
        const low = p.stock > 0 && p.stock <= 5;
        const tile = document.createElement("div");
        tile.className = "product-tile" + (out ? " out-of-stock" : "");
        tile.innerHTML = `
            <div class="product-emoji">${p.emoji}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-cat">${p.category}</div>
            <div class="product-bottom">
                <div class="product-price">P${p.price.toFixed(2)}</div>
                <div class="product-stock ${out ? 'out' : low ? 'low' : ''}">
                    ${out ? 'OUT' : p.stock > 900 ? '—' : p.stock}
                </div>
            </div>
        `;
        if (!out) tile.onclick = () => addToCart(p.id);
        grid.appendChild(tile);
    });
}

/* ============================================
   CART
============================================ */
function addToCart(productId) {
    const product = store.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.qty >= product.stock) {
            showToast("Not enough stock", "error");
            return;
        }
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(productId);
    else renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    renderCart();
}

function clearCart() {
    if (cart.length === 0) return;
    if (!confirm("Clear the entire cart?")) return;
    cart = [];
    renderCart();
}

function getSubtotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function getVAT() {
    return getSubtotal() * 0.12; // 12% Botswana VAT
}

function getTotal() {
    return getSubtotal() + getVAT();
}

function renderCart() {
    const container = document.getElementById("cart-items");
    const countEl = document.getElementById("cart-count");
    const subtotalEl = document.getElementById("summary-subtotal");
    const vatEl = document.getElementById("summary-vat");
    const totalEl = document.getElementById("summary-total");
    const checkoutBtn = document.getElementById("checkout-btn");

    if (!container) return;

    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    if (countEl) countEl.textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <p>Cart is empty</p>
                <small>Tap a product to add it</small>
            </div>
        `;
        if (subtotalEl) subtotalEl.textContent = "P0.00";
        if (vatEl) vatEl.textContent = "P0.00";
        if (totalEl) totalEl.textContent = "P0.00";
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-emoji">${item.emoji}</div>
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="price">P${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');

    if (subtotalEl) subtotalEl.textContent = `P${getSubtotal().toFixed(2)}`;
    if (vatEl) vatEl.textContent = `P${getVAT().toFixed(2)}`;
    if (totalEl) totalEl.textContent = `P${getTotal().toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

/* ============================================
   CHECKOUT / RECEIPT
============================================ */
function checkout() {
    if (cart.length === 0) return;

    const receipt = document.getElementById("receipt");
    const now = new Date();
    const receiptNum = `KCS-${String(store.sales.length + 1).padStart(5, '0')}`;

    receipt.innerHTML = `
        <div class="receipt-head">
            <h3>KASI CORNER STORE</h3>
            <p>Plot 5421, Gaborone CBD<br>
            TIN: BW001234567<br>
            +267 71 234 567</p>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#555; margin-bottom:12px;">
            <span>${receiptNum}</span>
            <span>${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>

        <div class="receipt-items">
            ${cart.map(i => `
                <div class="receipt-item">
                    <div class="receipt-item-left">
                        <div>${i.name}</div>
                        <div class="qty">${i.qty} × P${i.price.toFixed(2)}</div>
                    </div>
                    <div class="receipt-item-right">P${(i.price * i.qty).toFixed(2)}</div>
                </div>
            `).join('')}
        </div>

        <div class="receipt-totals">
            <div class="receipt-total-row">
                <span>Subtotal</span>
                <span>P${getSubtotal().toFixed(2)}</span>
            </div>
            <div class="receipt-total-row">
                <span>VAT (12%)</span>
                <span>P${getVAT().toFixed(2)}</span>
            </div>
            <div class="receipt-total-row grand">
                <span>TOTAL</span>
                <span>P${getTotal().toFixed(2)}</span>
            </div>
        </div>

        <div class="receipt-footer">
            Thank you for shopping with us!<br>
            Ke a leboga · Re a leboga<br>
            <span style="color:#999;">--- Powered by Digital Innovations ---</span>
        </div>
    `;

    document.getElementById("receipt-modal").classList.add("open");

    // Save the sale
    const sale = {
        receiptNum,
        timestamp: now.toISOString(),
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, emoji: i.emoji })),
        subtotal: getSubtotal(),
        vat: getVAT(),
        total: getTotal()
    };
    store.sales.push(sale);

    // Decrement stock
    cart.forEach(item => {
        const p = store.products.find(prod => prod.id === item.id);
        if (p) p.stock = Math.max(0, p.stock - item.qty);
    });

    saveData(store);
}

function closeReceipt() {
    document.getElementById("receipt-modal").classList.remove("open");
    cart = [];
    renderCart();
    renderProducts();
}

function printReceipt() {
    window.print();
}

/* ============================================
   TOAST
============================================ */
function showToast(message, type = "success") {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    const icon = type === "error" ? "fa-circle-exclamation" :
                 type === "success" ? "fa-circle-check" : "fa-circle-info";
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ============================================
   CLOCK
============================================ */
function updateClock() {
    const el = document.getElementById("clock");
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* ============================================
   INIT
============================================ */
document.addEventListener("DOMContentLoaded", () => {
    renderCategories();
    renderProducts();
    renderCart();
    updateClock();
    setInterval(updateClock, 1000);

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchTerm = e.target.value;
            renderProducts();
        });
    }
});
