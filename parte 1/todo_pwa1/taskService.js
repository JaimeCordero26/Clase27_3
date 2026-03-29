// taskService.js
// Capa de dominio: coordina memoria, persistencia local e importación desde backend.

import { dbGetAllTasks, dbUpsertTask, dbDeleteTask } from "./db.js";
import { apiGetAllTasks } from "./api.js";
import { apiCreateTask } from "./api.js";
import { apiUpdateTask } from "./api.js";
import { apiDeleteTask } from "./api.js";

let tasks = [];

function uid() {
  return "t_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

function sortTasks() {
  tasks.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function initTasks() {
  tasks = await dbGetAllTasks();
  sortTasks();
  return [...tasks];
}

export function getTasks() {
  return [...tasks];
}

export async function addTask(text) {
  const localTask = {
    id: uid(),
    text,
    done: false,
    updatedAt: Date.now(),
  };

  // guardar primero localmente
  await dbUpsertTask(localTask);

  try {
    const serverTask = await apiCreateTask(localTask);

    const normalized = {
      id: String(serverTask.id),
      text: serverTask.text,
      done: Boolean(serverTask.done),
      updatedAt: new Date(serverTask.updatedAt).getTime(),
      createdAt: serverTask.createdAt
        ? new Date(serverTask.createdAt).getTime()
        : Date.now(),
    };

    // eliminar el temporal local para evitar duplicado
    await dbDeleteTask(localTask.id);

    // guardar el definitivo del servidor
    await dbUpsertTask(normalized);

    // mantener memoria consistente
    tasks = tasks.filter((t) => t.id !== localTask.id);
    tasks.unshift(normalized);
  } catch (error) {
    console.error("No se pudo guardar en backend", error);

    // fallback offline: la tarea se queda local
    tasks.unshift(localTask);
  }

  return [...tasks];
}

export async function removeTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  await dbDeleteTask(id);

  // solo intentar backend si el id ya es del servidor
  if (!String(id).startsWith("t_")) {
    try {
      await apiDeleteTask(id);
    } catch (error) {
      console.error("No se pudo eliminar en backend", error);
    }
  }

  return [...tasks];
}

export async function toggleDone(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return [...tasks];

  const updated = { ...task, done: !task.done, updatedAt: Date.now() };

  tasks = tasks.map((t) => (t.id === id ? updated : t));
  await dbUpsertTask(updated);

  // solo intentar backend si el id ya es del servidor
  if (!String(id).startsWith("t_")) {
    try {
      const serverTask = await apiUpdateTask(updated);

      const normalized = {
        id: String(serverTask.id),
        text: serverTask.text,
        done: Boolean(serverTask.done),
        updatedAt: new Date(serverTask.updatedAt).getTime(),
        createdAt: serverTask.createdAt
          ? new Date(serverTask.createdAt).getTime()
          : updated.createdAt || Date.now(),
      };

      tasks = tasks.map((t) => (t.id === id ? normalized : t));
      await dbUpsertTask(normalized);
    } catch (error) {
      console.error("No se pudo actualizar estado en backend", error);
    }
  }

  sortTasks();
  return [...tasks];
}

export async function saveEdit(id, text) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return [...tasks];

  const updated = { ...task, text, updatedAt: Date.now() };

  tasks = tasks.map((t) => (t.id === id ? updated : t));
  await dbUpsertTask(updated);

  // solo intentar backend si el id ya es del servidor
  if (!String(id).startsWith("t_")) {
    try {
      const serverTask = await apiUpdateTask(updated);

      const normalized = {
        id: String(serverTask.id),
        text: serverTask.text,
        done: Boolean(serverTask.done),
        updatedAt: new Date(serverTask.updatedAt).getTime(),
        createdAt: serverTask.createdAt
          ? new Date(serverTask.createdAt).getTime()
          : updated.createdAt || Date.now(),
      };

      tasks = tasks.map((t) => (t.id === id ? normalized : t));
      await dbUpsertTask(normalized);
    } catch (error) {
      console.error("No se pudo actualizar en backend", error);
    }
  }

  sortTasks();
  return [...tasks];
}

export async function importTasksFromServer() {
  const serverTasks = await apiGetAllTasks();

  for (const task of serverTasks) {
    const normalized = {
      id: String(task.id),
      text: task.text,
      done: Boolean(task.done),
      updatedAt: new Date(task.updatedAt).getTime(),
      createdAt: task.createdAt ? new Date(task.createdAt).getTime() : Date.now(),
    };

    const index = tasks.findIndex((t) => t.id === normalized.id);

    if (index >= 0) {
      tasks[index] = normalized;
    } else {
      tasks.push(normalized);
    }

    await dbUpsertTask(normalized);
  }

  sortTasks();
  return [...tasks];
}