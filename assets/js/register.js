
const formRegistroEl = document.getElementById("formRegistro");
const divRegistroEl = formRegistroEl.querySelector(".message");

// --- TUS CREDENCIALES DE EMAILJS ---
// Reemplaza con tus propios datos
const EMAILJS_SERVICE_ID = 'service_4vhcwr3'; // Tu Service ID
const EMAILJS_WELCOME_TEMPLATE_ID = 'template_z23z44x'; // ¡ID de tu plantilla de bienvenida!
const EMAILJS_PUBLIC_KEY = '4dP9KUVzfc9IJTi3t'; // Tu Public Key

formRegistroEl.addEventListener("submit", (event) => {
  event.preventDefault(); 
  divRegistroEl.innerHTML = "";

  const formData = new FormData(formRegistroEl);
  const objectData = Object.fromEntries(formData); 
  
  if (!checkPasswords(objectData.password, objectData.passwordConfirm)) {
    renderError(divRegistroEl, "Las contraseñas no coinciden");
    formRegistroEl.reset();
    return;
  }

  if (localStorage.getItem(objectData.email)) {
    renderError(divRegistroEl, "Este correo electrónico ya está registrado.");
    return;
  }

  objectData.carrito = [];
  localStorage.setItem(objectData.email, JSON.stringify(objectData));
  renderSuccess(divRegistroEl, "¡Tu cuenta fue creada de manera exitosa!");

  enviarCorreoBienvenida(objectData.name, objectData.email);
  
  setTimeout(() => {
    formRegistroEl.reset();
    const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
    loginTab.show();
  }, 2000);
});

const checkPasswords = (password, passwordConfirm) => password === passwordConfirm;

function enviarCorreoBienvenida(nombre, correo) {
    console.log("Intentando enviar correo de bienvenida a:", correo);
    const templateParams = {
        user_name: nombre,
        user_email: correo
    };

    // La variable 'emailjs' ahora es visible para este script
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_WELCOME_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
        .then((response) => {
           console.log('¡Correo de bienvenida enviado!', response.status, response.text);
        }, (error) => {
           console.error('Fallo el envío del correo de bienvenida...', error);
           // Alerta para que el usuario vea el error en caso de fallo
           alert('Hubo un problema al enviar el correo de bienvenida. Revisa la consola para más detalles.');
        });
}

const renderError = (container, message) => {
  container.innerHTML = `<div class="alert alert-danger" role="alert">${message}</div>`;
};

const renderSuccess = (container, message) => {
  container.innerHTML = `<div class="alert alert-success" role="alert">${message}</div>`;
};