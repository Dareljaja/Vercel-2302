/**
 * 2302 - E-Commerce JavaScript 
 * COMPATIBLE CON PRODUCT-DETAIL.HTML
 */

let products = [];
let cart = [];
let productsRendered = false;
let collectionRendered = false;

// Placeholder cuando no hay URL de imagen (SVG gris con texto)
const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%231a1a1a" width="200" height="200"/%3E%3Ctext fill="%23666" x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-size="12" font-family="sans-serif"%3ESin imagen%3C/text%3E%3C/svg%3E';
if (typeof window !== 'undefined') window.PLACEHOLDER_IMG = PLACEHOLDER_IMG;

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
    products = Array.isArray(data) ? data : [];
        window.products = products;
        renderProducts(products);
        renderCollection();
    } catch (error) {
        console.error('Error:', error);
    }
}

function normalizeStock(p) {
    const raw = p?.stock ?? p?.Stock ?? p?.cantidad ?? p?.qty ?? null;
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : null;
}

function renderProducts(productsToRender) {
    if (!productsGrid || productsRendered) return;
    productsRendered = true;
    
    productsGrid.innerHTML = productsToRender.map((product) => {
        const imgUrl = product.imagen_url || product.image;
        const stock = normalizeStock(product);
        const outOfStock = stock !== null && stock <= 0;
        return `
        <article class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${imgUrl || PLACEHOLDER_IMG}" alt="${(product.name || '').replace(/"/g, '&quot;')}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;">
            </div>
            <div class="product-content">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name || product.nombre}</h3>
                <p class="product-price">$${product.price || product.precio}</p>
                ${stock !== null ? `<p class="product-description" style="margin-bottom:12px;">Stock: <strong>${stock}</strong></p>` : ''}
                <button class="product-btn" ${outOfStock ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''} onclick="event.stopPropagation(); addToCart(${JSON.stringify(product.id)}, 1)">
                    ${outOfStock ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
                </button>
            </div>
        </article>
    `;
    }).join('');
}

function renderCollection() {
    if (!collectionGrid || collectionRendered) return;
    collectionRendered = true;
    const collectionProducts = products.slice(0, 8);
    collectionGrid.innerHTML = collectionProducts.map((product) => {
        const imgUrl = product.imagen_url || product.image;
        return `
        <article class="collection-item" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <img src="${imgUrl || PLACEHOLDER_IMG}" alt="${(product.name || '').replace(/"/g, '&quot;')}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;">
            <div class="collection-overlay">
                <h3 class="collection-title">${product.name}</h3>
                <span class="collection-price">$${product.price}</span>
            </div>
        </article>
    `;
    }).join('');
}

// Lógica de Carrito básica para que no de error
window.addToCart = function(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const stock = normalizeStock(product);
    const existing = cart.find(item => item.id === productId);
    const currentQty = existing ? existing.quantity : 0;
    if (stock !== null && (currentQty + qty) > stock) {
        alert(`No hay stock suficiente. Disponible: ${stock}`);
        return;
    }
    if (existing) { existing.quantity += qty; } 
    else { cart.push({...product, quantity: qty}); }
    saveCartToStorage();
    updateCartUI();
}

function updateCartUI() {
    if (!cartCount) return;
    cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
    if (cartTotal) cartTotal.textContent = `$${cart.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0)}`;

    // Render items (simple)
    if (cartItemsContainer) {
        if (!cart.length) {
            cartItemsContainer.innerHTML = `
              <div class="cart-empty" id="cartEmpty">
                <i class="fas fa-shopping-bag"></i>
                <p>TU CARRITO ESTÁ VACÍO</p>
                <span>Agrega productos</span>
              </div>
            `;
        } else {
            cartItemsContainer.innerHTML = cart.map((item) => {
                const prod = products.find(p => p.id === item.id) || item;
                const stock = normalizeStock(prod);
                const imgUrl = prod.imagen_url || prod.image || PLACEHOLDER_IMG;
                const name = (prod.name || prod.nombre || 'Producto');
                const price = Number(prod.price || prod.precio || 0);
                const disablePlus = stock !== null && item.quantity >= stock;
                return `
                  <div class="cart-item" data-id="${String(item.id).replace(/"/g, '&quot;')}">
                    <div class="cart-item-image">
                      <img src="${imgUrl}" alt="${String(name).replace(/"/g, '&quot;')}" loading="lazy" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;">
                    </div>
                    <div class="cart-item-details">
                      <div class="cart-item-name">${name}</div>
                      <div class="cart-item-price">$${price.toLocaleString()}</div>
                      ${stock !== null ? `<div style="font-size:.75rem;color:#666;margin-bottom:8px;">Stock: ${stock}</div>` : ''}
                      <div class="cart-item-actions">
                        <div class="cart-quantity">
                          <button class="cart-quantity-btn" data-action="dec" aria-label="Disminuir"><i class="fas fa-minus"></i></button>
                          <span>${item.quantity}</span>
                          <button class="cart-quantity-btn" data-action="inc" aria-label="Aumentar" ${disablePlus ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}><i class="fas fa-plus"></i></button>
                        </div>
                        <button class="cart-item-remove" data-action="remove" aria-label="Quitar"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>
                `;
            }).join('');
        }
    }

    if (cartFooter) cartFooter.style.display = cart.length ? 'block' : 'none';
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

    cartOverlay?.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });

    cartItemsContainer?.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.cart-item');
        if (!itemEl) return;
        const idAttr = itemEl.getAttribute('data-id');
        const id = (idAttr != null && idAttr !== '') ? (isNaN(Number(idAttr)) ? idAttr : Number(idAttr)) : null;
        const actionBtn = e.target.closest('[data-action]');
        const action = actionBtn?.getAttribute('data-action');
        if (!action || id == null) return;

        const idx = cart.findIndex(i => i.id === id);
        if (idx === -1) return;
        const prod = products.find(p => p.id === id) || cart[idx];
        const stock = normalizeStock(prod);

        if (action === 'inc') {
            if (stock !== null && cart[idx].quantity >= stock) return;
            cart[idx].quantity += 1;
        } else if (action === 'dec') {
            cart[idx].quantity -= 1;
            if (cart[idx].quantity <= 0) cart.splice(idx, 1);
        } else if (action === 'remove') {
            cart.splice(idx, 1);
        }
        saveCartToStorage();
        updateCartUI();
    });

    document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
        if (!cart.length) return;
        try {
            // Revalidar stock contra el último catálogo cargado
            for (const it of cart) {
                const prod = products.find(p => p.id === it.id) || it;
                const stock = normalizeStock(prod);
                if (stock !== null && it.quantity > stock) {
                    alert(`Tu carrito supera el stock disponible de "${prod.name || prod.nombre}". Disponible: ${stock}`);
                    return;
                }
            }

            const payload = {
                items: cart.map(it => {
                    const prod = products.find(p => p.id === it.id) || it;
                    return {
                        id: prod.id,
                        name: prod.name || prod.nombre,
                        description: prod.description || prod.descripcion || '',
                        quantity: it.quantity,
                        price: prod.price || prod.precio,
                        image: prod.imagen_url || prod.image || ''
                    };
                }),
                payer: {}
            };

            const res = await fetch('/api/whatsapp-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'No se pudo iniciar la compra por WhatsApp');
            }

            // Vaciar carrito (stock ya fue descontado en servidor)
            cart = [];
            saveCartToStorage();
            updateCartUI();

            // Abrir WhatsApp con el pedido
            const url = data.whatsapp_url;
            if (url) window.location.href = url;
            else alert('Listo, pero faltó el link de WhatsApp.');
        } catch (err) {
            alert('Error de checkout: ' + (err?.message || err));
        }
    });
}