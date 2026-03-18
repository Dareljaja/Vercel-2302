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

(function () {
    var p = new URLSearchParams(window.location.search);
    var t = p.get('title');
    if (t) try { document.title = decodeURIComponent(t) + ' | 2302'; } catch (e) {}
})();

document.addEventListener('DOMContentLoaded', () => {
    loadProducts().then(() => {
        loadCartFromStorage();
        initEventListeners();
        updateCartUI();
    });
});

async function loadProducts() {
    try {
        const [productsRes, categoriesRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/categories').catch(() => null)
        ]);
        const data = await productsRes.json();
        products = Array.isArray(data) ? data.filter(function (p) { return p != null && (p.id != null || p.id === 0); }) : [];
        window.products = products;
        renderProducts(products);
        const catSelect = document.getElementById('productsCategory');
        if (catSelect && categoriesRes && categoriesRes.ok) {
            const categories = await categoriesRes.json();
            const list = Array.isArray(categories) ? categories : [];
            catSelect.innerHTML = '<option value="">Todas</option>' + list.map(function (c) {
                var slug = (c.slug || '').replace(/"/g, '&quot;');
                var nom = (c.nombre || c.slug || '').replace(/</g, '&lt;');
                return '<option value="' + slug + '">' + nom + '</option>';
            }).join('');
        }
        initProductsFilter();
        loadCollection();
        var params = new URLSearchParams(window.location.search);
        var categoryParam = params.get('category');
        var titleParam = params.get('title');
        if (titleParam) {
            try {
                document.title = decodeURIComponent(titleParam) + ' | 2302';
            } catch (e) {}
        }
        if (categoryParam && catSelect) {
            catSelect.value = categoryParam;
            applyProductsFilter();
            var productsSection = document.getElementById('products');
            if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadCollection() {
    if (!collectionGrid) return;
    try {
        const res = await fetch('/api/collection');
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        renderCollection(items);
    } catch (err) {
        console.error('Error loading collection:', err);
        renderCollection([]);
    }
}

function renderCollection(items) {
    if (!collectionGrid) return;
    collectionRendered = true;
    if (!items || items.length === 0) {
        collectionGrid.innerHTML = '<p class="collection-empty-hint" style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">No hay tarjetas de colección. Añádelas desde el panel de administración.</p>';
        return;
    }
    collectionGrid.innerHTML = items.map((c) => {
        const imgUrl = c.imagen_url || '';
        const titulo = (c.titulo || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        const tituloRaw = (c.titulo || '').trim();
        const desc = (c.descripcion || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        let href = (c.link || '').trim();
        if (href && !/^https?:\/\//i.test(href) && !href.startsWith('/') && !href.startsWith('#')) {
            if (/^\d+$/.test(href)) {
                href = 'product-detail.html?id=' + href;
            } else if (href.includes('.html')) {
                href = href;
            } else {
                href = 'index.html?category=' + encodeURIComponent(href) + (tituloRaw ? '&title=' + encodeURIComponent(tituloRaw) : '');
            }
        }
        const safeHref = (href || '').replace(/'/g, "\\'");
        const clickAttr = href ? `onclick="window.location.href='${safeHref}'"` : '';
        return `
        <article class="collection-item" ${clickAttr} style="cursor:${href ? 'pointer' : 'default'}">
            <img src="${imgUrl || PLACEHOLDER_IMG}" alt="${titulo}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;">
            <div class="collection-overlay">
                <h3 class="collection-title">${titulo}</h3>
                ${desc ? `<span class="collection-subtitle">${desc}</span>` : ''}
            </div>
        </article>
    `;
    }).join('');
}

function buildProductCardsHTML(productsToRender) {
    return (productsToRender || []).filter(function (p) { return p != null && (p.id != null || p.id === 0); }).map((product) => {
        const imgUrl = product.imagen_url || product.image;
        const name = product.name || product.nombre || '';
        const category = product.category || product.categoria || '';
        const stock = normalizeStock(product);
        const outOfStock = stock !== null && stock <= 0;
        const priceOriginal = product.price ?? product.precio ?? 0;
        const isOffer = product.offer && (product.precio_oferta != null && product.precio_oferta !== '');
        const priceShow = isOffer ? Number(product.precio_oferta) : priceOriginal;
        const priceBlock = isOffer
            ? '<p class="product-price"><span class="product-price-original">$' + Number(priceOriginal).toLocaleString() + '</span> <span class="product-price-current">$' + Number(priceShow).toLocaleString() + '</span></p>'
            : '<p class="product-price">$' + Number(priceShow).toLocaleString() + '</p>';
        return `
        <article class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${imgUrl || PLACEHOLDER_IMG}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;">
            </div>
            <div class="product-content">
                <span class="product-category">${category}</span>
                <h3 class="product-name">${name}</h3>
                ${priceBlock}
                ${stock !== null ? `<p class="product-description" style="margin-bottom:12px;">Stock: <strong>${stock}</strong></p>` : ''}
                <button class="product-btn" ${outOfStock ? 'disabled style="opacity:.6;cursor:not-allowed;"' : ''} onclick="event.stopPropagation(); addToCart(${JSON.stringify(product.id)}, event)">
                    ${outOfStock ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
                </button>
            </div>
        </article>
    `;
    }).join('');
}

function getFilteredProducts() {
    const searchEl = document.getElementById('productsSearch');
    const categoryEl = document.getElementById('productsCategory');
    const query = (searchEl && searchEl.value) ? searchEl.value.trim().toLowerCase() : '';
    const category = (categoryEl && categoryEl.value) ? categoryEl.value.trim().toLowerCase() : '';
    const searchWords = query ? query.split(/\s+/).filter(Boolean) : [];
    return products.filter((p) => {
        const matchCategory = !category || (p.category || p.categoria || '').toLowerCase() === category;
        if (!matchCategory) return false;
        if (!searchWords.length) return true;
        const name = (p.name || p.nombre || '').toLowerCase();
        const desc = (p.shortDescription || p.description || p.descripcion || '').toLowerCase();
        const cat = (p.category || p.categoria || '').toLowerCase();
        const text = name + ' ' + desc + ' ' + cat;
        return searchWords.every((word) => text.includes(word));
    });
}

function applyProductsFilter() {
    if (!productsGrid) return;
    const filtered = getFilteredProducts();
    productsGrid.innerHTML = buildProductCardsHTML(filtered);
    const emptyState = document.getElementById('productsEmptyState');
    if (emptyState) {
        emptyState.style.display = filtered.length ? 'none' : 'block';
    }
    productsGrid.style.display = filtered.length ? '' : 'none';
}

function initProductsFilter() {
    const searchEl = document.getElementById('productsSearch');
    const categoryEl = document.getElementById('productsCategory');
    if (searchEl) searchEl.addEventListener('input', applyProductsFilter);
    if (categoryEl) categoryEl.addEventListener('change', applyProductsFilter);
}

function renderProducts(productsToRender) {
    if (!productsGrid || productsRendered) return;
    productsRendered = true;
    productsGrid.innerHTML = buildProductCardsHTML(productsToRender);
    const emptyState = document.getElementById('productsEmptyState');
    if (emptyState) emptyState.style.display = 'none';
}


// Lógica de Carrito básica para que no de error (+ efecto visual en página principal)
window.addToCart = function(productId, ev) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    const stock = normalizeStock(product);
    const effectivePrice = (product.offer && product.precio_oferta != null && product.precio_oferta !== '') ? Number(product.precio_oferta) : Number(product.price ?? product.precio ?? 0);
    const existing = cart.find(item => item.id == productId);
    const currentQty = existing ? Number(existing.quantity) || 0 : 0;
    if (stock !== null && currentQty >= stock) {
        alert('Sin stock disponible para este producto.');
        return;
    }
    if (existing) { existing.quantity += 1; }
    else { cart.push({ ...product, price: effectivePrice, precio: effectivePrice, quantity: 1 }); }
    saveCartToStorage();
    updateCartUI();

    // Efecto visual: botón "agregado" + toast (solo si hay evento, ej. desde index)
    const btn = ev && ev.target ? ev.target.closest('.product-btn') : null;
    if (btn) {
        const originalHTML = btn.innerHTML;
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> AGREGADO';
        btn.disabled = true;
        const toast = document.getElementById('cartToast');
        if (toast) toast.classList.add('show');
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            if (toast) toast.classList.remove('show');
        }, 2000);
    }
};

// Para product-detail: agregar con cantidad y objeto producto (no depende de array products)
window.addToCartWithQuantity = function(productObj, quantity) {
    if (!productObj || quantity < 1) return;
    const id = productObj.id;
    const stock = normalizeStock(productObj);
    const effectivePrice = (productObj.offer && productObj.precio_oferta != null && productObj.precio_oferta !== '') ? Number(productObj.precio_oferta) : Number(productObj.precio ?? productObj.price ?? 0);
    const existing = cart.find(item => item.id == id);
    const item = {
        id: productObj.id,
        name: productObj.nombre || productObj.name,
        nombre: productObj.nombre || productObj.name,
        price: effectivePrice,
        precio: effectivePrice,
        imagen_url: productObj.imagen_url || productObj.image,
        image: productObj.imagen_url || productObj.image,
        quantity: 0
    };
    const currentQty = existing ? Number(existing.quantity) || 0 : 0;
    const addQty = Math.max(1, parseInt(quantity, 10) || 1);
    if (stock !== null && (currentQty + addQty) > stock) {
        alert('No hay stock suficiente para esa cantidad.');
        return;
    }
    if (existing) existing.quantity += addQty;
    else { item.quantity = addQty; cart.push(item); }
    saveCartToStorage();
    updateCartUI();
};

if (typeof window !== 'undefined') window.refreshCartUI = updateCartUI;

function getItemPrice(item) {
    return Number(item.price ?? item.precio ?? 0);
}
function getItemName(item) {
    return item.name ?? item.nombre ?? 'Producto';
}
function getItemImage(item) {
    return item.imagen_url ?? item.image ?? PLACEHOLDER_IMG;
}

function normalizeStock(p) {
    const raw = p?.stock ?? p?.Stock ?? p?.cantidad ?? p?.qty ?? null;
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : null;
}

function renderCartItems() {
    if (!cartItemsContainer) return;
    const total = cart.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0);
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty" id="cartEmpty">
                <i class="fas fa-shopping-bag"></i>
                <p>TU CARRITO ESTÁ VACÍO</p>
                <span>Agrega productos</span>
            </div>`;
        if (cartEmpty) cartEmpty.style.display = '';
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }
    const itemsHtml = cart.map((item) => {
        const price = getItemPrice(item);
        const name = getItemName(item);
        const img = getItemImage(item);
        const subtotal = price * item.quantity;
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${img}" alt="${String(name).replace(/"/g, '&quot;')}" onerror="this.src=window.PLACEHOLDER_IMG||this.src">
                </div>
                <div class="cart-item-details">
                    <span class="cart-item-name">${String(name).replace(/</g, '&lt;')}</span>
                    <span class="cart-item-price">$${subtotal.toLocaleString()}</span>
                    <div class="cart-item-actions">
                        <div class="cart-quantity">
                            <button type="button" class="cart-quantity-btn" aria-label="Menos" onclick="window.cartQuantity(${JSON.stringify(item.id)}, -1)">−</button>
                            <span>${item.quantity}</span>
                            <button type="button" class="cart-quantity-btn" aria-label="Más" onclick="window.cartQuantity(${JSON.stringify(item.id)}, 1)">+</button>
                        </div>
                        <button type="button" class="cart-item-remove" aria-label="Quitar" onclick="window.removeFromCart(${JSON.stringify(item.id)})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
    }).join('');
    cartItemsContainer.innerHTML = itemsHtml;
    const emptyEl = document.getElementById('cartEmpty');
    if (emptyEl) emptyEl.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';
}

window.cartQuantity = function(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    if (delta > 0) {
        const prod = products.find(p => p.id == productId) || item;
        const stock = normalizeStock(prod);
        if (stock !== null && item.quantity >= stock) {
            alert('No hay más stock disponible para este producto.');
            return;
        }
    }
    item.quantity += delta;
    if (item.quantity < 1) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCartToStorage();
    updateCartUI();
};

window.removeFromCart = function(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCartToStorage();
    updateCartUI();
};

function updateCartUI() {
    if (cartCount) cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
    const total = cart.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0);
    if (cartTotal) cartTotal.textContent = `$${total.toLocaleString()}`;
    renderCartItems();
}

function saveCartToStorage() { localStorage.setItem('2302_cart', JSON.stringify(cart)); }
function loadCartFromStorage() {
    const saved = localStorage.getItem('2302_cart');
    if (saved) cart = JSON.parse(saved);
}

function initEventListeners() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenuBtn?.classList.toggle('active');
        mobileNav?.classList.toggle('active');
        document.body.style.overflow = mobileNav?.classList.contains('active') ? 'hidden' : '';
    });
    document.querySelectorAll('.mobile-nav-link')?.forEach((link) => {
        link.addEventListener('click', () => {
            mobileMenuBtn?.classList.remove('active');
            mobileNav?.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    document.getElementById('cartBtn')?.addEventListener('click', () => {
        cartSidebar?.classList.add('active');
        cartOverlay?.classList.add('active');
    });
    document.getElementById('cartClose')?.addEventListener('click', () => {
        cartSidebar?.classList.remove('active');
        cartOverlay?.classList.remove('active');
    });
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        if (cart.length === 0) return;
        cartSidebar?.classList.remove('active');
        cartOverlay?.classList.remove('active');
        window.location.href = 'checkout.html';
    });

    // Formulario CONECTA (contacto) — envía correo vía /api/contact
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const formError = document.getElementById('formError');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (formSuccess) formSuccess.classList.remove('show');
            if (formError) { formError.textContent = ''; formError.className = 'form-error'; }
            const name = (document.getElementById('name') || {}).value?.trim();
            const email = (document.getElementById('email') || {}).value?.trim();
            const message = (document.getElementById('message') || {}).value?.trim();
            if (!name || !email || !message) {
                if (formError) { formError.textContent = 'Completa todos los campos.'; formError.classList.add('show'); }
                return;
            }
            const btn = contactForm.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'ENVIANDO...'; }
            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.success) {
                    contactForm.reset();
                    if (formSuccess) formSuccess.classList.add('show');
                } else {
                    if (formError) {
                        formError.textContent = data.message || 'Error al enviar. Intenta de nuevo.';
                        formError.classList.add('show');
                    }
                }
            } catch (err) {
                if (formError) {
                    formError.textContent = 'Error de conexión. Intenta de nuevo.';
                    formError.classList.add('show');
                }
            } finally {
                if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'ENVIAR'; }
            }
        });
    }
}