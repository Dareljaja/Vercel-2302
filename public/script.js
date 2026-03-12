/**
 * 2302 - E-Commerce JavaScript (Vercel Version)
 * Updated API endpoints to /api/
 */

// ============================================
// Global Variables
let products = [];
let cart = [];
let productsRendered = false;
let collectionRendered = false;
let currentProduct = null;
let currentImageIndex = 0;

// DOM Elements
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
// INITIALIZATION
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
 * Load products from Vercel API
 */
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Error loading products');
        
        products = await response.json();
        renderProducts(products);
        renderCollection();
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadFallbackProducts();
    }
}

// ... (rest of JS functions remain the same as original - cart, modal, etc.)

// Rest of the script remains identical to the original script.js
// (Include all the functions from the original script.js content here for completeness)

function loadFallbackProducts() {
    // Same fallback products as original
    if (products.length > 0) return;
    
    products = [
        // ... same fallback data
    ];
    
    renderProducts(products);
    renderCollection();
}

// All other functions (renderProducts, addToCart, etc.) remain exactly the same
// Copy the rest from original script.js

// For checkout, update to use /api/create-preference
async function createMercadoPagoPreference() {
    if (cart.length === 0) return;
    
    try {
        const preferenceData = {
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                description: 'Producto 2302',
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            payer: {
                name: 'Cliente', // From shipping form in future
                email: 'cliente@example.com'
            }
        };

        const response = await fetch('/api/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preferenceData)
        });

        const result = await response.json();
        
        if (result.success && result.init_point) {
            window.location.href = result.init_point;
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Error al procesar pago');
    }
}

// Update checkout button
function handleCheckout() {
    // For now use WhatsApp, but can add MercadoPago
    showPaymentModal();
}

// All other functions exactly the same as original

