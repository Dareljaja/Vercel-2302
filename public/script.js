/**
 * 2302 - E-Commerce JavaScript 
 * ARQUITECTURA: HTML + JS (SIN PHP) - COMPATIBLE CON VERCEL/SUPABASE
 */

// Variables Globales
let products = [];
let cart = [];
let productsRendered = false;
let collectionRendered = false;

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const collectionGrid = document.getElementById('collectionGrid');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');
const cartEmpty = document.getElementById('cartEmpty');
const header = document.getElementById('header');
const mobileNav = document.getElementById('mobileNav');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    productsRendered = false;
    collectionRendered = false;
    
    loadProducts().then(() => {
        loadCartFromStorage();
        initEventListeners();
        updateCartUI();
    });
});

/**
 * Carga productos desde la API de Vercel (que conecta a Supabase)
 */
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        products = Array.isArray(data) ? data : [];
        
        renderProducts(products);
        renderCollection();
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        productsGrid.innerHTML = '<p class="no-results">Error al conectar con la base de datos.</p>';
    }
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

function renderProducts(productsToRender) {
    if (!productsGrid || productsRendered) return;
    productsRendered = true;
    
    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p class="no-results">No hay productos disponibles.</p>';
        return;
    }
    
    productsGrid.innerHTML = productsToRender.map((product) => `
        <article class="product-card" onclick="window.open('product-detail.html?id=${product.id}', '_blank')">
            <div class="product-image">
                <img src="${product.imagen_url || product.image}" alt="${product.nombre || product.name}" loading="lazy">
                ${product.offer ? '<span class="product-badge offer">Oferta</span>' : ''}
            </div>
            <div class="product-content">
                <span class="product-category">${getCategoryLabel(product.category)}</span>
                <h3 class="product-name">${product.nombre || product.name}</h3>
                <p class="product-description">${product.descripcion || product.shortDescription || ''}</p>
                <div class="product-price-container">
                    <span class="product-price">$${product.precio || product.price}</span>
                </div>
                <button class="product-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                    <i class="fas fa-plus"></i> AGREGAR AL CARRITO
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
        <article class="collection-item" onclick="window.open('product-detail.html?id=${product.id}', '_blank')">
            <img src="${product.imagen_url || product.image}" alt="${product.nombre || product.name}" loading="lazy">
            <div class="collection-overlay">
                <h3 class="collection-title">${product.nombre || product.name}</h3>
                <span class="collection-price">$${product.precio || product.price}</span>
            </div>
            <button class="collection-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                <i class="fas fa-plus"></i>
            </button>
        </article>
    `).join('');
}

function getCategoryLabel(category) {
    const labels = { 'face': 'Rostro', 'body': 'Cuerpo', 'hair': 'Cabello' };
    return labels[category] || 'CUIDADO PREMIUM';
}

// ============================================
// FUNCIONES DEL CARRITO
// ============================================

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.nombre || product.name,
            price: product.precio || product.price,
            image: product.imagen_url || product.image,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    openCartSidebar();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) cart = cart.filter(i => i.id !== productId);
    saveCartToStorage();
    updateCartUI();
}

function updateCartUI() {
    if (!cartCount) return;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <span class="cart-item-price">$${item.price}</span>
                <div class="cart-item-actions">
                    <div class="cart-quantity">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.textContent = `$${total}`;
    cartEmpty.style.display = cart.length === 0 ? 'flex' : 'none';
    cartFooter.style.display = cart.length === 0 ? 'none' : 'block';
}

// ============================================
// UTILIDADES (STORAGE Y NAVEGACIÓN)
// ============================================

function saveCartToStorage() { localStorage.setItem('2302_cart', JSON.stringify(cart)); }
function loadCartFromStorage() {
    const saved = localStorage.getItem('2302_cart');
    if (saved) cart = JSON.parse(saved);
}

function openCartSidebar() { cartSidebar?.classList.add('active'); cartOverlay?.classList.add('active'); }
function closeCartSidebar() { cartSidebar?.classList.remove('active'); cartOverlay?.classList.remove('active'); }

function initEventListeners() {
    document.getElementById('cartBtn')?.addEventListener('click', openCartSidebar);
    document.getElementById('cartClose')?.addEventListener('click', closeCartSidebar);
    cartOverlay?.addEventListener('click', closeCartSidebar);
    mobileMenuBtn?.addEventListener('click', () => mobileNav.classList.toggle('active'));
}

window.addToCart = addToCart;
window.updateQuantity = updateQuantity;