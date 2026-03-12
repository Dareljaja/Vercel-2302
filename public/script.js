/**
 * 2302 - Official E-Commerce Script
 */
let products = [];
let cart = [];

const productsGrid = document.getElementById('productsGrid');
const collectionGrid = document.getElementById('collectionGrid');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');

document.addEventListener('DOMContentLoaded', () => {
    loadProducts().then(() => {
        loadCartFromStorage();
        initEventListeners();
        updateCartUI();
    });
});

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Error en API');
        products = await response.json();
        renderProducts(products);
        renderCollection();
    } catch (error) {
        console.error('Usando productos de respaldo...', error);
        loadFallbackProducts();
    }
}

function loadFallbackProducts() {
    products = [
        { id: '1', name: 'Crema Rosa Vivant', price: 15000, image: 'assets/2302-pie-de-pagina.png' },
        { id: '2', name: 'Serum Premium', price: 18000, image: 'assets/2302-pie-de-pagina.png' }
    ];
    renderProducts(products);
    renderCollection();
}

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

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const itemInCart = cart.find(item => item.id === id);
    if (itemInCart) { itemInCart.quantity++; } 
    else { cart.push({ ...product, quantity: 1 }); }
    saveCart();
    updateCartUI();
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
}

function updateCartUI() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = cart.length === 0 ? '<p>Tu carrito está vacío</p>' : 
        cart.map(item => `
            <div class="cart-item" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>${item.name} (x${item.quantity})</span>
                <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:gold; cursor:pointer;">✕</button>
            </div>
        `).join('');

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotal.innerText = `$${total.toLocaleString('es-AR')}`;
    cartCount.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);
    document.getElementById('cartFooter').style.display = cart.length > 0 ? 'block' : 'none';
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() { localStorage.setItem('cart_2302', JSON.stringify(cart)); }
function loadCartFromStorage() {
    const saved = localStorage.getItem('cart_2302');
    if (saved) cart = JSON.parse(saved);
}

async function handleCheckout() {
    try {
        const response = await fetch('/api/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart.map(item => ({
                    title: item.name,
                    unit_price: item.price,
                    quantity: item.quantity
                }))
            })
        });
        const data = await response.json();
        if (data.init_point) window.location.href = data.init_point;
    } catch (e) { alert('Error al procesar pago'); }
}

function initEventListeners() {
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
    document.getElementById('cartBtn')?.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });
    document.getElementById('closeCart')?.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
    cartOverlay?.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
}