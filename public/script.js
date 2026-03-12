/**
 * 2302 - E-Commerce Official Script
 */

// Variables Globales
let products = [];
let cart = [];

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const collectionGrid = document.getElementById('collectionGrid');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadProducts().then(() => {
        loadCartFromStorage();
        initEventListeners();
        updateCartUI();
    });
});

// --- CARGA DE PRODUCTOS ---
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Error en API');
        products = await response.json();
        renderProducts(products);
        renderCollection();
    } catch (error) {
        console.error('Cargando productos de respaldo...', error);
        loadFallbackProducts();
    }
}

function loadFallbackProducts() {
    products = [
        { id: '1', name: 'Crema Rosa Vivant', price: 15000, image: 'assets/producto1.jpg' },
        { id: '2', name: 'Serum Facial Hidratante', price: 12000, image: 'assets/producto2.jpg' }
    ];
    renderProducts(products);
    renderCollection();
}

// --- RENDERIZADO ---
function renderProducts(list) {
    if (!productsGrid) return;
    productsGrid.innerHTML = list.map(p => `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name}">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>$${p.price.toLocaleString('es-AR')}</p>
                <button class="btn btn-primary" onclick="addToCart('${p.id}')">AGREGAR</button>
            </div>
        </div>
    `).join('');
}

function renderCollection() {
    if (!collectionGrid) return;
    collectionGrid.innerHTML = products.slice(0, 3).map(p => `
        <div class="collection-item">
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
        </div>
    `).join('');
}

// --- CARRITO ---
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const itemInCart = cart.find(item => item.id === id);

    if (itemInCart) {
        itemInCart.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    // Opcional: abrir el carrito automáticamente al agregar
    document.getElementById('cartSidebar')?.classList.add('active');
}

function updateCartUI() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name} (x${item.quantity})</span>
            <span>$${(item.price * item.quantity).toLocaleString('es-AR')}</span>
            <button onclick="removeFromCart('${item.id}')">✕</button>
        </div>
    `).join('');

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.innerText = `$${total.toLocaleString('es-AR')}`;
    if (cartCount) cartCount.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart_2302', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('cart_2302');
    if (saved) cart = JSON.parse(saved);
}

// --- MERCADO PAGO ---
async function handleCheckout() {
    if (cart.length === 0) return alert('El carrito está vacío');

    try {
        const response = await fetch('/api/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart.map(item => ({
                    id: item.id,
                    title: item.name,
                    unit_price: item.price,
                    quantity: item.quantity
                }))
            })
        });

        const data = await response.json();
        if (data.init_point) {
            window.location.href = data.init_point;
        } else {
            throw new Error('No se pudo crear el pago');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al conectar con Mercado Pago');
    }
}

// --- EVENTOS ---
function initEventListeners() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const openCart = document.getElementById('cartBtn');

    openCart?.addEventListener('click', () => cartSidebar.classList.add('active'));
    closeCart?.addEventListener('click', () => cartSidebar.classList.remove('active'));
}