const formLoginEl = document.getElementById("formLogin");
const divLoginEl = formLoginEl.querySelector(".message");

const userContentEl = document.getElementById("userContent");
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");
const logoutBtnEl = document.getElementById("logoutBtn");

formLoginEl.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = event.target.elements["email"].value;
  const password = event.target.elements["password"].value;
  const localData = getUserInfo(email);

  if (!localData || !checkPassword(localData, password)) {
    renderError(divLoginEl, "La combinación de usuario y contraseña no es correcta.");
    return;
  }
  
  renderSuccess(divLoginEl, "¡Login exitoso!");
  localStorage.setItem('usuarioActivo', email);

  setTimeout(() => {
    mostrarInfoUsuario(localData);
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasUsuario'));
    if(offcanvas) offcanvas.hide();
  }, 1500);
});

const getUserInfo = (email) => {
  const data = localStorage.getItem(email);
  return data ? JSON.parse(data) : undefined;
};

const checkPassword = ({ password }, loginPassword) => password === loginPassword;

logoutBtnEl.addEventListener("click", () => {
  localStorage.removeItem('usuarioActivo');

  userContentEl.classList.add("d-none");
  formLoginEl.classList.remove("d-none");
  document.getElementById("formRegistro").classList.remove("d-none");
  document.getElementById("Tabslogyreg").classList.remove("d-none");
  divLoginEl.innerHTML = "";
  formLoginEl.reset();
});

function mostrarInfoUsuario(userData) {
    formLoginEl.classList.add("d-none");
    document.getElementById("formRegistro").classList.add("d-none");
    document.getElementById("Tabslogyreg").classList.add("d-none");

    userNameEl.textContent = userData.name;
    userEmailEl.textContent = userData.email;
    userContentEl.classList.remove("d-none");
}

document.addEventListener('DOMContentLoaded', () => {
    const emailUsuarioActivo = localStorage.getItem('usuarioActivo');
    if (emailUsuarioActivo) {
        const userData = getUserInfo(emailUsuarioActivo);
        if (userData) {
            mostrarInfoUsuario(userData);
        }
    }
});