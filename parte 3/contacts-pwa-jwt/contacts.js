import {
  fetchContacts,
  createContact,
  deleteContact,
  refreshToken,
  logout,
} from "./api.js";
import { isLoggedIn, getApiBase, getRefreshToken } from "./auth.js";

const tokenInfo = document.getElementById("tokenInfo");
const status = document.getElementById("status");
const list = document.getElementById("list");
const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono");
const emailInput = document.getElementById("email");
const addBtn = document.getElementById("addBtn");
const loadBtn = document.getElementById("loadBtn");
const refreshTokenBtn = document.getElementById("refreshTokenBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (!isLoggedIn()) {
  window.location.href = "./login.html";
}

function renderContacts(contacts) {
  list.innerHTML = "";

  if (!contacts || contacts.length === 0) {
    list.innerHTML = '<p class="empty">No hay contactos para mostrar.</p>';
    return;
  }

  for (const c of contacts) {
    const item = document.createElement("article");
    item.className = "contact";
    item.innerHTML = `
      <div class="contact-header">
        <div>
          <div class="contact-name">${c.nombre}</div>
          <div class="contact-meta">
            <span>Teléfono: ${c.telefono}</span>
            <span>Email: ${c.email ?? "-"}</span>
            <span>ID: ${c.id}</span>
          </div>
        </div>
        <div class="actions">
          <button data-delete="${c.id}" class="danger">Borrar</button>
        </div>
      </div>
    `;

    item.querySelector("[data-delete]").addEventListener("click", async () => {
      try {
        status.textContent = `Eliminando contacto ${c.id}...`;
        await deleteContact(c.id);
        status.textContent = "Contacto eliminado.";
        await loadContacts();
      } catch (error) {
        status.textContent = `Error al borrar: ${error.message}`;
      }
    });

    list.appendChild(item);
  }
}

async function loadContacts() {
  try {
    status.textContent = "Cargando contactos...";
    const contacts = await fetchContacts();
    renderContacts(contacts);
    status.textContent = `Se cargaron ${contacts.length} contactos.`;
  } catch (error) {
    status.textContent = `Error al cargar contactos: ${error.message}`;
  }
}

async function handleAdd() {
  try {
    const nombre = nombreInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const email = emailInput.value.trim();

    if (!nombre || !telefono) {
      status.textContent = "Nombre y teléfono son obligatorios.";
      return;
    }

    status.textContent = "Creando contacto...";
    await createContact({
      nombre,
      telefono,
      email: email || null,
    });

    nombreInput.value = "";
    telefonoInput.value = "";
    emailInput.value = "";

    status.textContent = "Contacto creado correctamente.";
    await loadContacts();
  } catch (error) {
    status.textContent = `Error al crear contacto: ${error.message}`;
  }
}

async function handleRefreshToken() {
  try {
    status.textContent = "Refrescando access token...";
    const data = await refreshToken();
    updateHeaderInfo();
    status.textContent = `Token refrescado. Expira en ${data.expiresIn} segundos.`;
  } catch (error) {
    status.textContent = `Error al refrescar token: ${error.message}`;
  }
}

async function handleLogout() {
  try {
    status.textContent = "Cerrando sesión...";
    await logout();
  } finally {
    window.location.href = "./login.html";
  }
}

function updateHeaderInfo() {
  tokenInfo.textContent = `API: ${getApiBase()} | Refresh token: ${
    getRefreshToken() ? "disponible" : "no disponible"
  }`;
}

addBtn.addEventListener("click", handleAdd);
loadBtn.addEventListener("click", loadContacts);
refreshTokenBtn.addEventListener("click", handleRefreshToken);
logoutBtn.addEventListener("click", handleLogout);

updateHeaderInfo();
loadContacts();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(console.error);
}
