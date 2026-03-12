/**
 * 2302 - E-Commerce JavaScript
 * ELEGANT MINIMALIST DESIGN
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
 * Load products from JSON
 */
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        products = Array.isArray(data) ? data : [];
        if (products.length === 0) {
            console.warn('No products found');
        }
        renderProducts(products);
        renderCollection();
        
    } catch (error) {
        console.error('Products load error:', error);
        products = [];
        renderProducts(products);
        renderCollection();
    }
}


/**
 * Fallback products
 */
function loadFallbackProducts() {
    if (products.length > 0) return;
    
    products = [
        { 
            id: 1, 
            name: "Crema Corporal", 
            shortDescription: "Fórmula avanzada con Aloe Vera. Hidratación profunda.", 
            description: "Fórmula avanzada con Aloe Vera. Hidratación profunda de siguiente generación.",
            detailedDescription: "Fórmula avanzada con Aloe Vera. Hidratación profunda de siguiente generación. Especialmente formulada para proporcionar hidratación intensiva.",
            ingredients: "Aloe Vera, Glicerina, Vitaminas",
            howToUse: "Aplicar sobre piel limpia",
            size: "400ml",
            price: 4500, 
            originalPrice: null, 
            category: "body", 
            image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&h=1000&fit=crop"
            ],
            popular: true, 
            offer: false 
        },
        { 
            id: 2, 
            name: "Sérum Facial", 
            shortDescription: "Vitamina C al 15%. Ilumina, firma y protege.", 
            description: "Vitamina C al 15%. Ilumina, firma y protege.",
            detailedDescription: "Sérum avanzado de vitamina C con 15% de concentración. Ilumina, firma y protege.",
            ingredients: "Vitamina C 15%, Ácido Hialurónico, Vitamina E",
            howToUse: "Aplicar por la mañana antes de la crema",
            size: "30ml",
            price: 5800, 
            originalPrice: null, 
            category: "face", 
            image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1617897903246-719242758050?w=800&h=1000&fit=crop"
            ],
            popular: true, 
            offer: false 
        },
        { 
            id: 3, 
            name: "Gel de Limpieza", 
            shortDescription: "Con extracto de té verde. Limpia sin irritar.", 
            description: "Con extracto de té verde. Limpia sin irritar.",
            detailedDescription: "Gel limpiador suave con extracto de té verde. Limpia sin irritar.",
            ingredients: "Té Verde, Aloe Vera, Manzanilla",
            howToUse: "Aplicar sobre rostro húmedo",
            size: "150ml",
            price: 3200, 
            originalPrice: null, 
            category: "face", 
            image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=1000&fit=crop"
            ],
            popular: true, 
            offer: false 
        },
        { 
            id: 4, 
            name: "Protector Solar SPF 50", 
            shortDescription: "Fórmula mineral invisible. Protección amplio espectro.", 
            description: "Fórmula mineral invisible. Protección amplio espectro.",
            detailedDescription: "Protector solar mineral invisible con óxido de zinc. Protección de amplio espectro.",
            ingredients: "Óxido de Zinc, Vitamina E, Té Verde",
            howToUse: "Aplicar 15 minutos antes del sol",
            size: "50ml",
            price: 3800, 
            originalPrice: null, 
            category: "face", 
            image: "https://images.unsplash.com/photo-1571781565023-4d619426f83c?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1571781565023-4d619426f83c?w=800&h=1000&fit=crop"
            ],
            popular: true, 
            offer: false 
        },
        { 
            id: 5, 
            name: "Champú", 
            shortDescription: "Sin sulfatos con aceite de argán.", 
            description: "Sin sulfatos con aceite de argán.",
            detailedDescription: "Fórmula suave sin sulfatos con aceite de argán. Limpia sin quitar los aceites naturales.",
            ingredients: "Aceite de Argán, Queratina, Ginseng",
            howToUse: "Aplicar sobre cabello mojado",
            size: "300ml",
            price: 2800, 
            originalPrice: 3500, 
            category: "hair", 
            image: "https://images.unsplash.com/photo-1585232351009-31338186ce39?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1585232351009-31338186ce39?w=800&h=1000&fit=crop"
            ],
            popular: false, 
            offer: true 
        },
        { 
            id: 6, 
            name: "Crema Nocturna", 
            shortDescription: "Con retinol y péptidos. Despierta con piel renovada.", 
            description: "Con retinol y péptidos. Despierta con piel renovada.",
            detailedDescription: "Tratamiento reparador nocturno con retinol y péptidos. Despierta con piel renovada.",
            ingredients: "Retinol, Péptidos de Cobre, Ceramidas",
            howToUse: "Aplicar por la noche sobre piel limpia",
            size: "50ml",
            price: 6500, 
            originalPrice: null, 
            category: "face", 
            image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&h=1000&fit=crop"
            ],
            popular: true, 
            offer: false 
        },
        { 
            id: 7, 
            name: "Crema de Ojos", 
            shortDescription: "Complejo de cafeína y ácido hialurónico.", 
            description: "Complejo de cafeína y ácido hialurónico.",
            detailedDescription: "Tratamiento específico para ojeras e inflamación. Complejo de cafeína y ácido hialurónico.",
            ingredients: "Cafeína, Ácido Hialurónico, Péptidos",
            howToUse: "Aplicar con suaves golpecitos",
            size: "15ml",
            price: 5200, 
            originalPrice: null, 
            category: "face", 
            image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1617897903246-719242758050?w=800&h=1000&fit=crop"
            ],
            popular: false, 
            offer: false 
        },
        { 
            id: 8, 
            name: "Acondicionador", 
            shortDescription: "Con aceite de coco. Desenreda y nutre.", 
            description: "Con aceite de coco. Desenreda y nutre.",
            detailedDescription: "Acondicionador intensivo con aceite de coco. Desenreda y nutre profundamente.",
            ingredients: "Aceite de Coco, Manteca de Karité, Proteínas",
            howToUse: "Aplicar en длины и кончики",
            size: "300ml",
            price: 2600, 
            originalPrice: null, 
            category: "hair", 
            image: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&h=1000&fit=crop"
            ],
            popular: false, 
            offer: false 
        },
        { 
            id: 9, 
            name: "Bálsamo Labial", 
            shortDescription: "Con miel de manuka. Ultra suave.", 
            description: "Con miel de manuka. Ultra suave.",
            detailedDescription: "Tratamiento nutritivo para labios con miel de manuka. Ultra suave.",
            ingredients: "Miel de Manuka, Aceite de Jojoba, Vitamina E",
            howToUse: "Aplicar según sea necesario",
            size: "10ml",
            price: 1800, 
            originalPrice: null, 
            category: "face", 
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=1000&fit=crop"
            ],
            popular: false, 
            offer: false 
        },
        { 
            id: 10, 
            name: "Tónico", 
            shortDescription: "Con hamamelis y té verde. Refina poros.", 
            description: "Con hamamelis y té verde. Refina poros.",
            detailedDescription: "Tónico equilibrante con hamamelis y té verde. Refina poros, prepara la piel.",
            ingredients: "Hamamelis, Té Verde, Ácido Láctico",
            howToUse: "Aplicar después de la limpieza",
            size: "200ml",
            price: 2400, 
            originalPrice: 3000, 
            category: "face", 
            image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=500&fit=crop",
            images: [
                "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=1000&fit=crop"
            ],
            popular: true, 
            offer: true 
        }
    ];
    
    renderProducts(products);
    renderCollection();
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderProducts(productsToRender) {
    if (!productsGrid) return;
    if (productsRendered) return;
    productsRendered = true;
    
    if (!productsToRender || productsToRender.length === 0) {
        productsGrid.innerHTML = '<p class="no-results">No se encontraron productos</p>';
        return;
    }
    
    productsGrid.innerHTML = productsToRender.map((product) => `
        <article class="product-card" onclick="openProductModal(${product.id})">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${renderBadges(product)}
            </div>
            <div class="product-content">
                <span class="product-category">${getCategoryLabel(product.category)}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.shortDescription || product.description}</p>
                <div class="product-price-container">
                    <span class="product-price">$${product.price}</span>
                    ${product.originalPrice ? `<span class="product-price-original">$${product.originalPrice}</span>` : ''}
                </div>
                <button class="product-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                    <i class="fas fa-plus"></i>
                    AGREGAR AL CARRITO
                </button>
            </div>
        </article>
    `).join('');
}

function renderCollection() {
    if (!collectionGrid) return;
    if (collectionRendered) return;
    collectionRendered = true;
    
    const collectionProducts = products.slice(0, 8);
    
    collectionGrid.innerHTML = collectionProducts.map((product) => `
        <article class="collection-item" onclick="openProductModal(${product.id})">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="collection-overlay">
                <h3 class="collection-title">${product.name}</h3>
                <span class="collection-price">$${product.price}</span>
            </div>
            <button class="collection-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                <i class="fas fa-plus"></i>
            </button>
        </article>
    `).join('');
}

function renderBadges(product) {
    let badges = '';
    if (product.offer) {
        badges += '<span class="product-badge offer">Oferta</span>';
    } else if (product.popular) {
        badges += '<span class="product-badge popular">Popular</span>';
    }
    return badges;
}

function getCategoryLabel(category) {
    const labels = { 
        'face': 'Rostro', 
        'body': 'Cuerpo', 
        'hair': 'Cabello' 
    };
    return labels[category] || category;
}

// ============================================
// PRODUCT MODAL FUNCTIONS
// ============================================

function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    currentImageIndex = 0;
    
    // Create modal if not exists
    let modalOverlay = document.getElementById('productModalOverlay');
    
    if (!modalOverlay) {
        modalOverlay = createProductModal();
        document.body.appendChild(modalOverlay);
    }
    
    // Update modal content
    updateProductModal(product);
    
    // Show modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createProductModal() {
    const modal = document.createElement('div');
    modal.id = 'productModalOverlay';
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal">
            <button class="product-modal-close" onclick="closeProductModal()">
                <i class="fas fa-times"></i>
            </button>
            <div class="product-modal-gallery">
                <img class="product-modal-main-image" id="modalMainImage" src="" alt="">
                <div class="product-modal-thumbnails" id="modalThumbnails"></div>
            </div>
            <div class="product-modal-content">
                <span class="product-modal-category" id="modalCategory"></span>
                <h2 class="product-modal-name" id="modalName"></h2>
                <div class="product-modal-price" id="modalPrice"></div>
                <p class="product-modal-description" id="modalDescription"></p>
                
                <div class="product-modal-divider"></div>
                
                <p class="product-modal-label">Ingredientes</p>
                <p class="product-modal-text" id="modalIngredients"></p>
                
                <div class="product-modal-divider"></div>
                
                <p class="product-modal-label">Modo de uso</p>
                <p class="product-modal-text" id="modalHowToUse"></p>
                
                <div class="product-modal-size" id="modalSize">
                    <i class="fas fa-tint"></i>
                    <span></span>
                </div>
                
                <div class="product-modal-actions">
                    <button class="btn btn-primary" id="modalAddToCart">
                        <i class="fas fa-shopping-bag"></i>
                        AGREGAR AL CARRITO
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProductModal();
        }
    });
    
    // Add keyboard escape
    document.addEventListener('keydown', handleModalKeydown);
    
    return modal;
}

function updateProductModal(product) {
    const mainImage = document.getElementById('modalMainImage');
    const thumbnails = document.getElementById('modalThumbnails');
    const category = document.getElementById('modalCategory');
    const name = document.getElementById('modalName');
    const price = document.getElementById('modalPrice');
    const description = document.getElementById('modalDescription');
    const ingredients = document.getElementById('modalIngredients');
    const howToUse = document.getElementById('modalHowToUse');
    const size = document.getElementById('modalSize');
    const addToCartBtn = document.getElementById('modalAddToCart');
    
    // Get images array
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    
    // Update main image
    mainImage.src = images[0];
    mainImage.alt = product.name;
    
    // Update thumbnails
    thumbnails.innerHTML = images.map((img, index) => `
        <div class="product-modal-thumb ${index === 0 ? 'active' : ''}" onclick="changeModalImage(${index})">
            <img src="${img}" alt="${product.name} - Imagen ${index + 1}">
        </div>
    `).join('');
    
    // Update content
    category.textContent = getCategoryLabel(product.category);
    name.textContent = product.name;
    
    let priceHTML = `$${product.price}`;
    if (product.originalPrice) {
        priceHTML += `<span class="product-modal-price-original">$${product.originalPrice}</span>`;
    }
    price.innerHTML = priceHTML;
    
    description.textContent = product.detailedDescription || product.description;
    ingredients.textContent = product.ingredients || 'Información no disponible';
    howToUse.textContent = product.howToUse || 'Información no disponible';
    size.querySelector('span').textContent = product.size || 'Información no disponible';
    
    // Update add to cart button
    addToCartBtn.onclick = () => {
        addToCart(product.id);
    };
}

function changeModalImage(index) {
    const product = currentProduct;
    if (!product) return;
    
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    
    if (index >= 0 && index < images.length) {
        currentImageIndex = index;
        
        // Update main image
        const mainImage = document.getElementById('modalMainImage');
        mainImage.src = images[index];
        
        // Update thumbnail active state
        document.querySelectorAll('.product-modal-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModalOverlay');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = '';
    currentProduct = null;
}

function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
    if (e.key === 'ArrowLeft' && currentProduct) {
        const images = currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images : [currentProduct.image];
        const newIndex = (currentImageIndex - 1 + images.length) % images.length;
        changeModalImage(newIndex);
    }
    if (e.key === 'ArrowRight' && currentProduct) {
        const images = currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images : [currentProduct.image];
        const newIndex = (currentImageIndex + 1) % images.length;
        changeModalImage(newIndex);
    }
}

// ============================================
// CART FUNCTIONS
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
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.classList.add('animate');
        setTimeout(() => cartBtn.classList.remove('animate'), 300);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCartToStorage();
        updateCartUI();
    }
}

function updateCartUI() {
    if (!cartCount) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    renderCartItems();
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) {
        cartTotal.textContent = `$${total}`;
    }
    
    if (cart.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'flex';
        if (cartFooter) cartFooter.style.display = 'none';
    } else {
        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'block';
    }
}

function renderCartItems() {
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <span class="cart-item-price">$${item.price}</span>
                <div class="cart-item-actions">
                    <div class="cart-quantity">
                        <button class="cart-quantity-btn" onclick="updateQuantity(${item.id}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="cart-quantity-btn" onclick="updateQuantity(${item.id}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveCartToStorage() {
    try {
        localStorage.setItem('2302_cart', JSON.stringify(cart));
    } catch (e) {}
}

function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem('2302_cart');
        if (saved) cart = JSON.parse(saved);
    } catch (e) {
        cart = [];
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function initEventListeners() {
    document.getElementById('cartBtn')?.addEventListener('click', openCartSidebar);
    document.getElementById('cartClose')?.addEventListener('click', closeCartSidebar);
    cartOverlay?.addEventListener('click', closeCartSidebar);
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
    
    window.addEventListener('scroll', handleScroll);
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', handleSmoothScroll);
    });
    
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (mobileNav) mobileNav.classList.remove('active');
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
        });
    });
}

function handleCheckout() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    showPaymentModal(total);
}

function showPaymentModal(total) {
    const existingModal = document.getElementById('paymentModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="payment-modal-overlay" id="paymentModalOverlay"></div>
        <div class="payment-modal-content">
            <button class="payment-modal-close" id="paymentModalClose">
                <i class="fas fa-times"></i>
            </button>
            <h3 class="payment-modal-title">FINALIZAR COMPRA</h3>
            <p class="payment-modal-total">TOTAL: <strong>$${total}</strong></p>
            
            <form id="shippingForm" class="shipping-form">
                <h4 class="shipping-title">DATOS DE ENVÍO</h4>
                <div class="form-group">
                    <input type="text" id="shippingName" class="form-input" required placeholder="Nombre completo">
                </div>
                <div class="form-group">
                    <input type="text" id="shippingAddress" class="form-input" required placeholder="Dirección">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" id="shippingCity" class="form-input" required placeholder="Ciudad">
                    </div>
                    <div class="form-group">
                        <input type="text" id="shippingProvince" class="form-input" required placeholder="Provincia">
                    </div>
                </div>
                <div class="form-group">
                    <input type="text" id="shippingCP" class="form-input" required placeholder="Código Postal">
                </div>
                <div class="form-group">
                    <input type="tel" id="shippingPhone" class="form-input" required placeholder="Teléfono">
                </div>
            </form>
            
            <div class="payment-options">
                <button class="payment-option-btn whatsapp" id="payWithWhatsApp">
                    <i class="fab fa-whatsapp"></i>
                    <span>WHATSAPP</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addPaymentModalStyles();
    
    setTimeout(() => modal.classList.add('active'), 10);
    
    document.getElementById('paymentModalClose').addEventListener('click', closePaymentModal);
    document.getElementById('paymentModalOverlay').addEventListener('click', closePaymentModal);
    
    const getShippingData = () => ({
        name: document.getElementById('shippingName')?.value.trim(),
        address: document.getElementById('shippingAddress')?.value.trim(),
        city: document.getElementById('shippingCity')?.value.trim(),
        province: document.getElementById('shippingProvince')?.value.trim(),
        cp: document.getElementById('shippingCP')?.value.trim(),
        phone: document.getElementById('shippingPhone')?.value.trim()
    });
    
    const validateShipping = () => {
        const data = getShippingData();
        if (!data.name || !data.address || !data.city || !data.province || !data.cp || !data.phone) {
            alert('Completá todos los datos');
            return false;
        }
        return true;
    };
    
    const generateWhatsAppMessage = (total, shipping) => {
        let msg = "¡Hola! Quiero comprar en 2302:%0A%0A";
        cart.forEach(item => {
            msg += `• ${item.name} x${item.quantity} - $${item.price * item.quantity}%0A`;
        });
        msg += `%0A*TOTAL: $${total}*%0A%0A`;
        msg += "*ENVÍO:*%0A";
        msg += `${shipping.name}%0A${shipping.address}, ${shipping.city}, ${shipping.province}%0A${shipping.cp}%0A${shipping.phone}`;
        return msg;
    };
    
    document.getElementById('payWithWhatsApp').addEventListener('click', () => {
        if (!validateShipping()) return;
        
        const shipping = getShippingData();
        const msg = generateWhatsAppMessage(total, shipping);
        const whatsappUrl = `https://wa.me/543543560057?text=${msg}`;
        window.open(whatsappUrl, '_blank');
    });
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function addPaymentModalStyles() {
    if (document.getElementById('paymentModalStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'paymentModalStyles';
    styles.textContent = `
        .payment-modal {
            position: fixed;
            inset: 0;
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
        }
        
        .payment-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .payment-modal-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
        }
        
        .payment-modal-content {
            position: relative;
            background: #1f1f1f;
            padding: 40px;
            max-width: 450px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid rgba(201, 169, 98, 0.2);
        }
        
        .payment-modal-close {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            color: #a0a0a0;
            background: none;
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .payment-modal-close:hover {
            color: #c9a962;
            border-color: #c9a962;
        }
        
        .payment-modal-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            letter-spacing: 2px;
            color: #fff;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .payment-modal-total {
            font-size: 1.1rem;
            color: #a0a0a0;
            margin-bottom: 25px;
        }
        
        .payment-modal-total strong {
            color: #c9a962;
            font-size: 1.5rem;
        }
        
        .shipping-form { text-align: left; margin-bottom: 25px; }
        
        .shipping-title {
            font-family: 'DM Sans', sans-serif;
            font-size: 0.65rem;
            color: #c9a962;
            letter-spacing: 2px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .shipping-form .form-group { margin-bottom: 12px; }
        
        .shipping-form .form-input {
            width: 100%;
            padding: 12px 15px;
            font-size: 0.9rem;
            font-family: 'DM Sans', sans-serif;
            color: #fff;
            background: #141414;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
        }
        
        .shipping-form .form-input:focus {
            outline: none;
            border-color: #c9a962;
        }
        
        .shipping-form .form-input::placeholder { color: #666; }
        
        .shipping-form .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .payment-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .payment-option-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px 24px;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.7rem;
            font-weight: 500;
            letter-spacing: 2px;
            border: none;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .payment-option-btn.whatsapp {
            background: #25D366;
            color: #fff;
        }
        
        .payment-option-btn.whatsapp:hover {
            box-shadow: 0 0 25px rgba(37, 211, 102, 0.4);
        }
        
        @media (max-width: 480px) {
            .payment-modal-content { padding: 30px 20px; }
            .shipping-form .form-row { grid-template-columns: 1fr; }
        }
    `;
    
    document.head.appendChild(styles);
}

function openCartSidebar() {
    if (cartSidebar) cartSidebar.classList.add('active');
    if (cartOverlay) cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
    if (cartSidebar) cartSidebar.classList.remove('active');
    if (cartOverlay) cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleMobileMenu() {
    if (mobileNav) mobileNav.classList.toggle('active');
    if (mobileMenuBtn) mobileMenuBtn.classList.toggle('active');
}

function handleScroll() {
    if (window.scrollY > 50) {
        if (header) header.classList.add('scrolled');
    } else {
        if (header) header.classList.remove('scrolled');
    }
}

function handleSmoothScroll(e) {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href');
    if (!targetId || targetId === '#') return;
    
    const target = document.querySelector(targetId);
    if (target) {
        const headerHeight = header ? header.offsetHeight : 80;
        const targetPosition = target.offsetTop - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const message = document.getElementById('message')?.value.trim();
    
    if (!name || !email || !message) {
        alert('Completá todos los campos');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Email inválido');
        return;
    }
    
    if (formSuccess) formSuccess.classList.add('show');
    contactForm.reset();
    
    setTimeout(() => {
        if (formSuccess) formSuccess.classList.remove('show');
    }, 5000);
}

// Global functions
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.changeModalImage = changeModalImage;

