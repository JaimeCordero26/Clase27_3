// ui.js
// Capa de interfaz: DOM, render y eventos.

import {
  initTasks,
  getTasks,
  addTask,
  removeTask,
  toggleDone,
  saveEdit,
  importTasksFromServer,
  syncPendingTasks,
} from "./taskService.js";

const netStatus = document.getElementById("netStatus");
const syncStatus = document.getElementById("syncStatus");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const syncBtn = document.getElementById("syncBtn");
const list = document.getElementById("list");
const filterBtns = document.querySelectorAll(".filter");

const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

let currentFilter = "all";
let editingTaskId = null;

function getFilteredTasks() {
  const tasks = getTasks();

  return tasks.filter((t) => {
    if (currentFilter === "pending") return !t.done;
    if (currentFilter === "done") return t.done;
    return true;
  });
}

function render() {
  const filtered = getFilteredTasks();
  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<p style="color: #aab3c2; margin: 8px 0;">Sin tareas.</p>`;
    return;
  }

  for (const t of filtered) {
    const syncBadge =
      t.synced === false
        ? '<span class="sync-badge">Pendiente</span>'
        : "";

    const card = document.createElement("div");
    card.className = "card" + (t.done ? " done" : "");

    card.innerHTML = `
      <input type="checkbox" ${t.done ? "checked" : ""} aria-label="Completar" />
      <p class="title"></p>
      ${syncBadge}
      <div class="actions">
        <button class="icon-btn" data-action="edit" title="Editar">✎</button>
        <button class="icon-btn danger" data-action="delete" title="Borrar">🗑</button>
      </div>
    `;

    card.querySelector(".title").textContent = t.text;

    card.querySelector('input[type="checkbox"]').addEventListener("change", async () => {
      await toggleDone(t.id);
      render();
    });

    card.querySelector('[data-action="edit"]').addEventListener("click", () => {
      openEdit(t.id);
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      await removeTask(t.id);
      render();
    });

    list.appendChild(card);
  }
}

function openEdit(id) {
  const task = getTasks().find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;
  editInput.value = task.text;
  editModal.classList.remove("hidden");
  editInput.focus();
}

function closeEdit() {
  editingTaskId = null;
  editModal.classList.add("hidden");
}

async function handleAddTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  await addTask(text);
  taskInput.value = "";
  render();
}

async function handleSaveEdit() {
  const text = editInput.value.trim();
  if (!text || !editingTaskId) return;

  await saveEdit(editingTaskId, text);
  closeEdit();
  render();
}

async function handleImport() {
  try {
    syncStatus.textContent = "Importando tareas desde el servidor...";
    await importTasksFromServer();
    render();
    syncStatus.textContent = "Importación completada correctamente.";
  } catch (error) {
    syncStatus.textContent = `Falló la importación: ${error.message}`;
  }
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  netStatus.textContent = online ? "● Online" : "● Offline";
  netStatus.classList.toggle("online", online);
  netStatus.classList.toggle("offline", !online);
}

function bindEvents() {
  addBtn.addEventListener("click", handleAddTask);

  taskInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") await handleAddTask();
  });

  syncBtn.addEventListener("click", handleImport);

  cancelEditBtn.addEventListener("click", closeEdit);

  saveEditBtn.addEventListener("click", async () => {
    await handleSaveEdit();
  });

  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEdit();
  });

  editInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") await handleSaveEdit();
    if (e.key === "Escape") closeEdit();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  updateNetworkStatus();
}

document.getElementById("sync-btn").addEventListener("click", async () => {
  await syncPendingTasks();
  render();
});

export async function initUI() {
  await initTasks();
  bindEvents();
  render();
}