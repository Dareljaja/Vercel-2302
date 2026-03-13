/**
 * 2302 - E-Commerce JavaScript 
 * COMPATIBLE CON PRODUCT-DETAIL.HTML
 */

let products = [];
let cart = [];
let productsRendered = false;
let collectionRendered = false;

const productsGrid = document.getElementById('productsGrid');
const collectionGrid = document.getElementById('collectionGrid');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartTotal = document.getElementById('cartTotal');
const cartFooter = document.getElementById('cartFooter');
const cartEmpty = document.getElementById('cartEmpty');

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
        const data = await response.json();
    products = Array.isArray(data) ? data : [];    window.products = products;
        renderProducts(products);
        renderCollection();
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderProducts(productsToRender) {
    if (!productsGrid || productsRendered) return;
    productsRendered = true;
    
    productsGrid.innerHTML = productsToRender.map((product) => `
        <article class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${product.image || product.imagen_url}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-content">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name || product.nombre}</h3>
                <p class="product-price">$${product.price || product.precio}</p>
                <button class="product-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                    AGREGAR AL CARRITO
                </button>
            </div>
        </article>
    `).join('');
}

function renderCollection() {
    if (!collectionGrid || collectionRendered) return;
    collectionRendered = true;
    const collectionProducts = products.slice(0, 8);
    collectionGrid.innerHTML = collectionProducts.map((product) => `
        <article class="collection-item" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <img src="${product.image || product.imagen_url}" alt="${product.name}">
            <div class="collection-overlay">
                <h3 class="collection-title">${product.name}</h3>
                <span class="collection-price">$${product.price}</span>
            </div>
        </article>
    `).join('');
}

// Lógica de Carrito básica para que no de error
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) { existing.quantity += 1; } 
    else { cart.push({...product, quantity: 1}); }
    saveCartToStorage();
    updateCartUI();
}

function updateCartUI() {
    if (!cartCount) return;
    cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
    if (cartTotal) cartTotal.textContent = `$${cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)}`;
}

function saveCartToStorage() { localStorage.setItem('2302_cart', JSON.stringify(cart)); }
function loadCartFromStorage() {
    const saved = localStorage.getItem('2302_cart');
    if (saved) cart = JSON.parse(saved);
}

function initEventListeners() {
    document.getElementById('cartBtn')?.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });
    document.getElementById('cartClose')?.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
}