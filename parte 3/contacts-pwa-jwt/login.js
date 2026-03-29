import { login } from "./api.js";
import { setApiBase, isLoggedIn, getApiBase } from "./auth.js";

const apiBaseInput = document.getElementById("apiBase");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const status = document.getElementById("status");

apiBaseInput.value = getApiBase();

if (isLoggedIn()) {
  window.location.href = "./contacts.html";
}

loginBtn.addEventListener("click", async () => {
  try {
    status.textContent = "Solicitando token...";
    setApiBase(apiBaseInput.value);

    const data = await login(
      usernameInput.value.trim(),
      passwordInput.value
    );

    status.textContent = `Login correcto. Expira en ${data.expiresIn} segundos.`;
    window.location.href = "./contacts.html";
  } catch (error) {
    status.textContent = `Login falló: ${error.message}`;
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(console.error);
}
