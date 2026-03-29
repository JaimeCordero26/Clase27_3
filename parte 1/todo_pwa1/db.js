// db.js
// Wrapper minimalista para IndexedDB usando Promesas.
// Objetivo didáctico: evitar la verbosidad de la API nativa sin usar librerías externas.

const DB_NAME = "todoDB";
const DB_VERSION = 1;
const STORE = "tasks";

/**
 * Abre (o crea) la base de datos.
 * - Si no existe, crea el object store "tasks" con keyPath "id".
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Helper para ejecutar transacciones de forma segura.
 * mode: "readonly" | "readwrite"
 */
async function withStore(mode, fn) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);

    Promise.resolve(fn(store))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
      .catch(reject);
  });
}

/** Retorna todas las tareas */
export async function dbGetAllTasks() {
  return withStore("readonly", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

/** Inserta o actualiza una tarea */
export async function dbUpsertTask(task) {
  return withStore("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.put(task);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

/** Borra una tarea por id */
export async function dbDeleteTask(id) {
  return withStore("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

/** (Opcional) Borra TODO el store */
export async function dbClearAll() {
  return withStore("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}