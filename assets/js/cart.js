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
    totalEl.textContent = money(subtotal);
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



  function iniciarPago() {
    if (cart.length === 0) {
      alert("El carrito está vacío.");
      return;
    }
    closeCart();
    mostrarFormularioPago();
  }




function procesarPago(e) {
  e.preventDefault();
  const customerName = document.getElementById('card-name').value;
  const customerEmail = document.getElementById('payment-email').value;

  // CRÍTICO: Hacer una copia profunda del carrito ANTES de vaciarlo
  const cartSnapshot = JSON.parse(JSON.stringify(cart));
  
  const ticketData = prepararDatosDelTicket(customerName, customerEmail, cartSnapshot);
  mostrarTicketVisual(ticketData, cartSnapshot);
  enviarTicketPorEmail(ticketData);

  // Ahora sí, vaciar el carrito
  cart = [];
  saveCart();
  renderCart();
}

  function prepararDatosDelTicket(customerName, customerEmail, cartItems) {
    const ticketId = `TICKET-${Date.now()}`;
    const subtotal = cartItems.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const impuesto = subtotal * TASA_DE_IMPUESTO;
    const totalFinal = subtotal + impuesto + COSTO_DE_ENVIO;

    let itemsHtmlParaEmail = '<table style="width: 100%; border-collapse: collapse;">';
    cartItems.forEach(p => {

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

  function mostrarTicketVisual(ticketData, cartItems) {
  // Simplemente mostramos el mensaje de éxito en el modal.
  modalBody.innerHTML = `
      <div id="ticket-generado">
          <h2>¡Gracias por tu compra, ${ticketData.nombre_cliente}!</h2>
          <p><strong>Número de Ticket:</strong> ${ticketData.order_id}</p>
          <p>Hemos enviado una confirmación a <strong>${ticketData.email_destino}</strong>.</p>
      </div>
      <hr>
      `;
      
  // El event listener ahora llama a nuestra nueva función principal.
  document.querySelector('#btn-descargar-pdf').addEventListener('click', (event) => {
    // Pasamos los datos necesarios y el propio botón para dar feedback al usuario.
    generarYDescargarPdf(ticketData, cartItems, event.currentTarget);
  });
}

/**
 * Orquesta la generación del PDF. Este es el proceso:
 * 1. Crea un elemento HTML oculto.
 * 2. Busca todas las imágenes dentro de ese HTML.
 * 3. Usa 'fetch' para descargar cada imagen como un 'blob' (un archivo en memoria).
 * 4. Usa 'FileReader' para convertir ese blob a un formato de texto (Base64 Data URL).
 * 5. Reemplaza la URL original (http://...) de cada imagen por su versión en texto.
 * 6. Cuando TODAS las imágenes están convertidas, le pasa el HTML final a html2pdf.
 * 7. Limpia y elimina el elemento temporal.
 */
// VERSIÓN CORREGIDA
async function generarYDescargarPdf(ticketData, cartItems, buttonElement) {
  const spinner = buttonElement.querySelector('.spinner-border');
  buttonElement.disabled = true;
  spinner.style.display = 'inline-block';

  const opt = {
    margin: 0.5,
    filename: `${ticketData.order_id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  const htmlString = generarHtmlParaPdf(ticketData, cartItems);
  const element = document.createElement("div");
  element.style.position = "absolute";
  element.style.left = "-9999px";
  element.style.opacity = "0";
  element.innerHTML = htmlString;
  document.body.appendChild(element);

  const images = Array.from(element.querySelectorAll('img'));
  
  const imagePromises = images.map(img => {
    // CORRECCIÓN: Se eliminó { mode: 'no-cors' } para poder leer la respuesta.
    return fetch(img.src) 
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error HTTP! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result; 
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .catch(error => console.error(`No se pudo cargar la imagen ${img.src}:`, error));
  });

  await Promise.all(imagePromises);

  html2pdf().set(opt).from(element).save().then(() => {
    document.body.removeChild(element);
    buttonElement.disabled = false;
    spinner.style.display = 'none';
    console.log('✅ PDF generado y descargado exitosamente.');
  });
}

function generarHtmlParaPdf(ticketData, cartItems) {
  // --- Construcción del HTML para el ticket ---
  // SOLUCIÓN: Envolvemos el contenido en una estructura HTML completa.
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ticket de Compra - ${ticketData.order_id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h2 { color: #0056b3; }
        .ticket-header { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .customer-details p { margin: 2px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .items-table th, .items-table td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
        .items-table th { background-color: #f8f8f8; }
        .product-info { display: flex; align-items: center; }
        .product-info img { width: 50px; height: 50px; object-fit: cover; margin-right: 15px; border-radius: 5px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .totals-table { width: 40%; margin-left: 60%; margin-top: 20px; border-collapse: collapse; }
        .totals-table td { padding: 8px; }
        .totals-table .label { font-weight: bold; }
        .totals-table .final-total { font-size: 1.2em; font-weight: bold; border-top: 2px solid #333; }
      </style>
    </head>
    <body>
      <div class="ticket-header">
        <h2>Ticket de Compra - FITGEN</h2>
        <p><strong>Número de Orden:</strong> ${ticketData.order_id}</p>
      </div>

      <div class="customer-details">
        <h4>Datos del Cliente:</h4>
        <p><strong>Nombre:</strong> ${ticketData.nombre_cliente}</p>
        <p><strong>Email:</strong> ${ticketData.email_destino}</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th class="text-center">Cantidad</th>
            <th class="text-right">Precio Unitario</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems.map(p => `
            <tr>
              <td>
                <div class="product-info">
                  <img src="${p.image}" alt="${p.name}" crossorigin="anonymous">
                  <span>${p.name}</span>
                </div>
              </td>
              <td class="text-center">${p.quantity}</td>
              <td class="text-right">$${p.price.toFixed(2)}</td>
              <td class="text-right">$${(p.price * p.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td class="label">Envío:</td>
          <td class="text-right">$${ticketData.shipping}</td>
        </tr>
        <tr>
          <td class="label">Impuestos (16%):</td>
          <td class="text-right">$${ticketData.tax}</td>
        </tr>
        <tr>
          <td class="label final-total">Total:</td>
          <td class="text-right final-total">$${ticketData.order_total}</td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function descargarPDF(ticketId, htmlContent) {
  const opt = {
    margin: 0.5,
    filename: `${ticketId}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: true
    },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  const element = document.createElement("div");
  element.style.position = "absolute";
  element.style.left = "-9999px";
  element.style.top = "0";
  element.style.width = "800px";
  element.style.background = "white";
  element.style.padding = "20px";
  
  element.innerHTML = htmlContent;
  document.body.appendChild(element);

  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = () => {
          console.warn('Error cargando imagen:', img.src);
          resolve();
        };
        setTimeout(resolve, 3000);
      }
    });
  });

  Promise.all(imagePromises).then(() => {
    setTimeout(() => {
      html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
        console.log('✅ PDF generado exitosamente');
      }).catch(err => {
        console.error('❌ Error al generar PDF:', err);
        document.body.removeChild(element);
        alert('Hubo un error al generar el PDF. Por favor intenta nuevamente.');
      });
    }, 100);
  });
}




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


  checkoutBtn?.addEventListener('click', iniciarPago);
  closeModalBtn?.addEventListener('click', () => paymentModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target == paymentModal) {
      paymentModal.style.display = 'none';
    }
  });
 
  renderCart();
});