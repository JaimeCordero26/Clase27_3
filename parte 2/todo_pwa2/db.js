// db.js
const DB_NAME = "todoDB";
const DB_VERSION = 2;
const STORE = "tasks";
const DELETED_STORE = "deletedTasks";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(DELETED_STORE)) {
        db.createObjectStore(DELETED_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, storeName, fn) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    Promise.resolve(fn(store))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
      .catch(reject);
  });
}

export async function dbGetAllTasks() {
  return withStore("readonly", STORE, (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function dbUpsertTask(task) {
  return withStore("readwrite", STORE, (store) => {
    return new Promise((resolve, reject) => {
      const req = store.put(task);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function dbDeleteTask(id) {
  return withStore("readwrite", STORE, (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function dbClearAll() {
  return withStore("readwrite", STORE, (store) => {
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function dbInsertDeletedTask(task) {
  return withStore("readwrite", DELETED_STORE, (store) => {
    return new Promise((resolve, reject) => {
      const req = store.put(task);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function dbGetAllDeletedTasks() {
  return withStore("readonly", DELETED_STORE, (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function dbRemoveDeletedTask(id) {
  return withStore("readwrite", DELETED_STORE, (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}
