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
  try {
    cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    cart = [];
  }

  // --- INICIO: CÓDIGO AÑADIDO (CONSTANTES Y CREDENCIALES) ---
  const EMAILJS_SERVICE_ID = 'service_4vhcwr3'; // Tu Service ID
  const EMAILJS_TICKET_TEMPLATE_ID = 'template_mid36bg'; // Tu plantilla de Ticket/Recibo
  const EMAILJS_PUBLIC_KEY = '4dP9KUVzfc9IJTi3t'; // Tu Public Key

  const COSTO_DE_ENVIO = 50.00;
  const TASA_DE_IMPUESTO = 0.16;
  // --- FIN: CÓDIGO AÑADIDO ---


  // Referencias DOM
  const cartBtn = document.getElementById('cart-button');
  const cartPanel = document.getElementById('cart-panel');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart');
  const clearCartBtn = document.getElementById('clear-cart');
  const cartItemsEl = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const countBadgeEl = document.getElementById('cart-count');

  // --- INICIO: CÓDIGO AÑADIDO (REFERENCIAS DOM PARA PAGO) ---
  const checkoutBtn = document.getElementById('checkout-btn'); // Botón para procesar pago
  const paymentModal = document.getElementById('payment-modal'); // El modal
  const modalBody = document.getElementById('modal-body'); // El contenido del modal
  const closeModalBtn = document.querySelector('.close-button'); // Botón para cerrar modal
  // --- FIN: CÓDIGO AÑADIDO ---

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


  function getLoggedInUserData() {
  // El único cambio está aquí: usamos 'usuarioActivo'
  const currentUserEmail = localStorage.getItem('usuarioActivo'); 
  
  if (!currentUserEmail) {
    return null; // No hay usuario logueado.
  }

  const userDataString = localStorage.getItem(currentUserEmail);
  if (!userDataString) {
    return null; 
  }

  try {
    const userData = JSON.parse(userDataString);
    return {
      name: userData.name,
      email: userData.email
    };
  } catch (e) {
    console.error("Error al parsear los datos del usuario:", e);
    return null;
  }
}


function mostrarFormularioPago() {
  const userData = getLoggedInUserData();

  const defaultName = userData ? userData.name : '';
  const defaultEmail = userData ? userData.email : '';
  const isEmailReadonly = userData ? 'readonly' : '';

  modalBody.innerHTML = `
      <h2>Pago</h2>
      <p style="font-size: 0.8em; color: grey;"><strong>Aviso:</strong> No ingreses datos reales.</p>
      <form id="payment-form">
          <label>Nombre en la Tarjeta:</label>
          <input 
            type="text" 
            class="form-control mb-2" 
            id="card-name" 
            placeholder="Juan Pérez" 
            value="${defaultName}"
            required
          >
          
          <label>Número de Tarjeta:</label>
          <input type="text" class="form-control mb-2" id="card-number" placeholder="4242 4242 4242 4242" required>
          
          <div class="d-flex gap-3 mb-3">
              <div class="flex-grow-1">
                  <label>Fecha de Vencimiento:</label>
                  <input type="text" class="form-control" id="card-expiry" placeholder="MM/AA" required>
              </div>
              <div class="flex-grow-1">
                  <label>CVV:</label>
                  <input type="text" class="form-control" id="card-cvv" placeholder="123" required>
              </div>
          </div>
          <label>Correo para recibir el ticket:</label>
          <input 
            type="email" 
            class="form-control mb-3" 
            id="payment-email"  
            placeholder="tu@correo.com" 
            value="${defaultEmail}" 
            ${isEmailReadonly} 
            required
          >

          <button type="submit" class="btn btn-success">Confirmar Compra</button>
      </form>`;
  paymentModal.style.display = 'block';
  document.querySelector('#payment-form').addEventListener('submit', procesarPago);
}

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

  function money(n) {
    return `$${n.toFixed(2)} MXN`;
  }

  function renderCart() {
    cartItemsEl.innerHTML = '';
    let subtotal = 0,
      qty = 0;

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
    totalEl.textContent = money(subtotal); // Nota: El total final se calcula en el ticket
    countBadgeEl.textContent = String(qty);
  }

  function addItemFrom(btn) {
    const id = btn.dataset.id;
    const name = btn.dataset.name;
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
        const body = encodeURIComponent(`Se agotó el stock del producto ${name}.`);
        window.location.href = `mailto:fitgeneration.59@gmail.com?subject=${subject}&body=${body}`;
        return;
      }
    } else {
      cart.push({
        id,
        name,
        price,
        stock,
        image,
        quantity: 1
      });
    }
    saveCart();
    renderCart();
  }

  // --- INICIO: CÓDIGO AÑADIDO (FUNCIONES DE PAGO, TICKET, PDF Y EMAIL) ---

  function iniciarPago() {
    if (cart.length === 0) {
      alert("El carrito está vacío.");
      return;
    }
    closeCart(); // Cierra el panel del carrito
    mostrarFormularioPago();
  }




function procesarPago(e) {
  e.preventDefault();
  const customerName = document.getElementById('card-name').value;
  // Leemos el correo del nuevo ID único
  const customerEmail = document.getElementById('payment-email').value;

  const ticketData = prepararDatosDelTicket(customerName, customerEmail);
  mostrarTicketVisual(ticketData);
  enviarTicketPorEmail(ticketData);

  // Vaciar el carrito después del pago
  cart = [];
  saveCart();
  renderCart();
}

  function prepararDatosDelTicket(customerName, customerEmail) {
    const ticketId = `TICKET-${Date.now()}`;
    const subtotal = cart.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const impuesto = subtotal * TASA_DE_IMPUESTO;
    const totalFinal = subtotal + impuesto + COSTO_DE_ENVIO;

    let itemsHtmlParaEmail = '<table style="width: 100%; border-collapse: collapse;">';
    cart.forEach(p => {
        // Renombramos 'image' a 'imagen' para que coincida con la plantilla de EmailJS
        itemsHtmlParaEmail += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;"><img src="${p.image}" alt="${p.name}" style="height: 40px;"></td><td>${p.name} (x${p.quantity})</td><td style="text-align: right;">$${(p.price * p.quantity).toFixed(2)}</td></tr>`;
    });
    itemsHtmlParaEmail += '</table>';

    return {
      order_id: ticketId,
      shipping: COSTO_DE_ENVIO.toFixed(2),
      tax: impuesto.toFixed(2),
      order_total: totalFinal.toFixed(2),
      nombre_cliente: customerName,
      email_destino: customerEmail,
      items_html: itemsHtmlParaEmail
    };
  }

  function enviarTicketPorEmail(ticketData) {
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TICKET_TEMPLATE_ID, ticketData, EMAILJS_PUBLIC_KEY)
      .then(res => console.log('Correo de ticket enviado!', res.status))
      .catch(err => console.error('Fallo el envío del ticket.', err));
  }

  function mostrarTicketVisual(ticketData) {
  const htmlParaPdf = generarHtmlParaPdf(ticketData);
  
  modalBody.innerHTML = `
      <div id="ticket-generado">
          <h2>¡Gracias por tu compra, ${ticketData.nombre_cliente}!</h2>
          <p><strong>Número de Ticket:</strong> ${ticketData.order_id}</p>
          <p>Hemos enviado una confirmación a <strong>${ticketData.email_destino}</strong>.</p>
      </div>
      <hr>
      <button id="btn-descargar-pdf" class="btn btn-primary">Descargar Ticket (PDF)</button>`;
      
  document.querySelector('#btn-descargar-pdf').addEventListener('click', () => descargarPDF(ticketData.order_id, htmlParaPdf));
}

  function generarHtmlParaPdf(ticketData) {
    return `
        <div style="font-family: Arial, sans-serif; margin: 20px;">
            <h2>Ticket de Compra</h2><p><strong>Orden #:</strong> ${ticketData.order_id}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #eee; border-bottom: 1px solid #ddd;">
                    <th style="padding: 5px; text-align: left;">Producto</th>
                    <th style="padding: 5px;">Cantidad</th>
                    <th style="padding: 5px; text-align: right;">Subtotal</th>
                </tr>
                ${cart.map(p => `<tr><td style="padding: 5px; border-bottom: 1px solid #eee;">${p.name}</td><td style="padding: 5px; text-align: center; border-bottom: 1px solid #eee;">${p.quantity}</td><td style="padding: 5px; text-align: right; border-bottom: 1px solid #eee;">$${(p.price * p.quantity).toFixed(2)}</td></tr>`).join('')}
                <tr><td colspan="2" style="text-align: right; padding-top: 10px;">Envío:</td><td style="text-align: right;">$${ticketData.shipping}</td></tr>
                <tr><td colspan="2" style="text-align: right;">Impuestos:</td><td style="text-align: right;">$${ticketData.tax}</td></tr>
                <tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="2" style="text-align: right; padding-top: 5px;">Total:</td><td style="text-align: right;">$${ticketData.order_total}</td></tr>
            </table>
        </div>`;
  }

  function descargarPDF(ticketId, htmlContent) {
    const opt = {
      margin: 0.5,
      filename: `${ticketId}.pdf`,
      image: {
        type: 'jpeg',
        quality: 0.98
      },
      html2canvas: {
        scale: 2
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      }
    };
    html2pdf().from(htmlContent).set(opt).save();
  }

  // --- FIN: CÓDIGO AÑADIDO ---


  // Eventos
  $$('.add-to-cart').forEach(btn => btn.addEventListener('click', () => addItemFrom(btn)));

  cartBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openCart();
  });
  closeCartBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeCart();
  });
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


  // --- INICIO: CÓDIGO AÑADIDO (EVENTOS PARA EL MODAL DE PAGO) ---
  checkoutBtn?.addEventListener('click', iniciarPago);
  closeModalBtn?.addEventListener('click', () => paymentModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target == paymentModal) {
      paymentModal.style.display = 'none';
    }
  });
  // --- FIN: CÓDIGO AÑADIDO ---

  // Inicialización
  renderCart();
});