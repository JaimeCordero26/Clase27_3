// taskService.js
// Capa de dominio: coordina memoria, persistencia local e importación desde backend.

import { dbGetAllTasks, dbUpsertTask, dbDeleteTask } from "./db.js";
import { dbInsertDeletedTask, dbGetAllDeletedTasks, dbRemoveDeletedTask } from "./db.js";
import { apiGetAllTasks, apiCreateTask, apiUpdateTask, apiDeleteTask } from "./api.js";

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
    synced: false,
  };

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
      synced: true,
    };

    await dbDeleteTask(localTask.id);
    await dbUpsertTask(normalized);

    tasks = tasks.filter((t) => t.id !== localTask.id);
    tasks.unshift(normalized);
  } catch (error) {
    console.error("No se pudo guardar en backend", error);
    tasks.unshift(localTask);
  }

  return [...tasks];
}

export async function removeTask(id) {
  const task = tasks.find((t) => t.id === id);

  // 1. Quitar de memoria y de la tabla local tasks
  tasks = tasks.filter((t) => t.id !== id);
  await dbDeleteTask(id);

  // Solo intentar el API si el id ya es del servidor (no local)
  if (!String(id).startsWith("t_")) {
    // 2. Insertar en deletedTasks ANTES de intentar el borrado en API
    if (task) await dbInsertDeletedTask(task);

    try {
      await apiDeleteTask(id);
      // 3. API exitoso: limpiar de deletedTasks
      await dbRemoveDeletedTask(id);
    } catch (error) {
      // 4. API falló: se deja en deletedTasks para reintentar luego
      console.error("No se pudo eliminar en backend, queda en deletedTasks", error);
    }
  }

  return [...tasks];
}

export async function toggleDone(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return [...tasks];

  const updated = {
    ...task,
    done: !task.done,
    updatedAt: Date.now(),
    synced: false,
  };

  tasks = tasks.map((t) => (t.id === id ? updated : t));
  await dbUpsertTask(updated);

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
        synced: true,
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

  const updated = {
    ...task,
    text,
    updatedAt: Date.now(),
    synced: false,
  };

  tasks = tasks.map((t) => (t.id === id ? updated : t));
  await dbUpsertTask(updated);

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
        synced: true,
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

export async function syncPendingTasks() {
  // ── 1. Sincronizar tareas pendientes de crear/editar (igual que antes) ──
  const pendingTasks = tasks.filter((t) => t.synced === false);

  for (const task of pendingTasks) {
    try {
      if (String(task.id).startsWith("t_")) {
        const serverTask = await apiCreateTask(task);
        const normalized = {
          id: String(serverTask.id),
          text: serverTask.text,
          done: Boolean(serverTask.done),
          updatedAt: new Date(serverTask.updatedAt).getTime(),
          createdAt: serverTask.createdAt
            ? new Date(serverTask.createdAt).getTime()
            : Date.now(),
          synced: true,
        };
        await dbDeleteTask(task.id);
        await dbUpsertTask(normalized);
        tasks = tasks.map((t) => (t.id === task.id ? normalized : t));
      } else {
        const serverTask = await apiUpdateTask(task);
        const normalized = {
          id: String(serverTask.id),
          text: serverTask.text,
          done: Boolean(serverTask.done),
          updatedAt: new Date(serverTask.updatedAt).getTime(),
          createdAt: serverTask.createdAt
            ? new Date(serverTask.createdAt).getTime()
            : task.createdAt || Date.now(),
          synced: true,
        };
        await dbUpsertTask(normalized);
        tasks = tasks.map((t) => (t.id === task.id ? normalized : t));
      }
    } catch (error) {
      console.error("No se pudo sincronizar tarea pendiente", error);
    }
  }

  // ── 2. Reintentar borrados pendientes en deletedTasks ──
  const deletedPending = await dbGetAllDeletedTasks();

  for (const task of deletedPending) {
    try {
      await apiDeleteTask(task.id);
      // Exitoso: limpiar de deletedTasks
      await dbRemoveDeletedTask(task.id);
    } catch (error) {
      // Falló: se deja en deletedTasks, se reintentará en la próxima sync
      console.error("No se pudo reintentar borrado en API, se deja en deletedTasks", error);
    }
  }

  sortTasks();
  return [...tasks];
}
