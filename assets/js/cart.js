/*
 * cart.js  —  Carrito con persistencia y control de stock.
 * - Persiste en localStorage bajo la clave 'cart-fitgen'.
 * - Usa los atributos data-* de los botones .add-to-cart.
 * - Muestra miniatura, nombre, precio; permite +, −, eliminar y vaciar.
 * - Si se intenta superar el stock, alerta y abre mail a fitgeneration.59@gmail.com.
 */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'cart-fitgen';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { cart = []; }

  // Referencias DOM
  const cartBtn       = document.getElementById('cart-button');
  const cartPanel     = document.getElementById('cart-panel');
  const cartOverlay   = document.getElementById('cart-overlay');
  const closeCartBtn  = document.getElementById('close-cart');
  const clearCartBtn  = document.getElementById('clear-cart');
  const cartItemsEl   = document.getElementById('cart-items');
  const subtotalEl    = document.getElementById('cart-subtotal');
  const totalEl       = document.getElementById('cart-total');
  const countBadgeEl  = document.getElementById('cart-count');

  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function openCart() {
    cartPanel.classList.add('cart-panel--open');
    cartOverlay.classList.add('cart-overlay--open');
  }
  function closeCart() {
    cartPanel.classList.remove('cart-panel--open');
    cartOverlay.classList.remove('cart-overlay--open');
  }

  function money(n) { return `$${n.toFixed(2)} MXN`; }

  function renderCart() {
    cartItemsEl.innerHTML = '';
    let subtotal = 0, qty = 0;

    cart.forEach((item, index) => {
      subtotal += item.price * item.quantity;
      qty += item.quantity;

      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item__info">
          <img src="${item.image}" alt="${item.name}" class="cart-item__img">
          <div>
            <div class="cart-item__name">${item.name}</div>
            <div class="cart-item__price">${money(item.price)}</div>
          </div>
        </div>
        <div class="cart-item__actions">
          <button class="decrease" data-index="${index}" aria-label="Disminuir">−</button>
          <span class="cart-item__quantity">${item.quantity}</span>
          <button class="increase" data-index="${index}" aria-label="Aumentar">＋</button>
          <button class="remove"   data-index="${index}" aria-label="Eliminar">&times;</button>
        </div>
      `;
      cartItemsEl.appendChild(li);
    });

    subtotalEl.textContent = money(subtotal);
    totalEl.textContent    = money(subtotal);
    countBadgeEl.textContent = String(qty);
  }

  function addItemFrom(btn) {
    const id    = btn.dataset.id;
    const name  = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const stock = parseInt(btn.dataset.stock, 10);
    const image = btn.dataset.image;

    const found = cart.find(p => p.id === id);
    if (found) {
      if (found.quantity < stock) {
        found.quantity += 1;
      } else {
        alert(`No hay más stock disponible para ${name}.`);
        const subject = encodeURIComponent(`Stock agotado: ${name}`);
        const body    = encodeURIComponent(`Se agotó el stock del producto ${name}.`);
        window.location.href = `mailto:fitgeneration.59@gmail.com?subject=${subject}&body=${body}`;
        return;
      }
    } else {
      cart.push({ id, name, price, stock, image, quantity: 1 });
    }
    saveCart();
    renderCart();
  }

  // Eventos
  $$('.add-to-cart').forEach(btn => btn.addEventListener('click', () => addItemFrom(btn)));

  cartBtn?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
  closeCartBtn?.addEventListener('click', (e) => { e.preventDefault(); closeCart(); });
  cartOverlay?.addEventListener('click', closeCart);

  clearCartBtn?.addEventListener('click', () => {
    cart = [];
    saveCart();
    renderCart();
  });

  cartItemsEl.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const idx = parseInt(t.dataset.index, 10);
    if (Number.isNaN(idx)) return;

    if (t.classList.contains('increase')) {
      if (cart[idx].quantity < cart[idx].stock) cart[idx].quantity++;
      else alert(`Stock máximo alcanzado para ${cart[idx].name}`);
    } else if (t.classList.contains('decrease')) {
      cart[idx].quantity--;
      if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    } else if (t.classList.contains('remove')) {
      cart.splice(idx, 1);
    }

    saveCart();
    renderCart();
  });

  // Inicialización
  renderCart();
});
