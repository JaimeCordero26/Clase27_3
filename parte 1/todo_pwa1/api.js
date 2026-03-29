// api.js
// Capa de acceso al backend .NET.
// En esta semana solo importamos tareas desde el servidor.

const API_BASE = "http://localhost:5000";

async function parseJson(response) {
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  return await response.json();
}

export async function apiGetAllTasks() {
  const response = await fetch(`${API_BASE}/tasks`);
  return await parseJson(response);
}

export async function apiCreateTask(task) {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: task.text,
      done: task.done,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  return await response.json();
}

export async function apiUpdateTask(task) {
  const response = await fetch(`${API_BASE}/tasks/${task.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: task.text,
      done: task.done,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  return await response.json();
}

export async function apiDeleteTask(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  return true;
}