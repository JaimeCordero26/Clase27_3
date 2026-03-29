# Evidencias — Ejercicio de Clase
**Proyecto:** `todo_pwa2`  
**Fecha:** 29 de marzo de 2026  
**Archivo base modificado:** `db.js`, `taskService.js`

---

## 1. Agregar tabla `deletedTasks` al `todoDB`

### Cambio en `db.js`

Se subió `DB_VERSION` de `1` a `2` para forzar el evento `onupgradeneeded` y crear el nuevo object store.

```js
const DB_VERSION = 2;
const DELETED_STORE = "deletedTasks";

req.onupgradeneeded = () => {
  const db = req.result;

  if (!db.objectStoreNames.contains(STORE)) {
    db.createObjectStore(STORE, { keyPath: "id" });
  }

  // Nueva tabla para borrados pendientes de sincronizar
  if (!db.objectStoreNames.contains(DELETED_STORE)) {
    db.createObjectStore(DELETED_STORE, { keyPath: "id" });
  }
};
```

Se agregaron tres nuevas funciones exportadas para operar sobre `deletedTasks`:

```js
// Inserta una tarea en la tabla de borrados pendientes
export async function dbInsertDeletedTask(task) { ... }

// Retorna todas las tareas pendientes de borrar en el API
export async function dbGetAllDeletedTasks() { ... }

// Elimina un registro de deletedTasks una vez que el API confirmó el borrado
export async function dbRemoveDeletedTask(id) { ... }
```

**Resultado en IndexedDB:**  
`todoDB` versión 2 con los stores `tasks` y `deletedTasks` visibles en DevTools → Application → IndexedDB.

---

## 2. Modificar `taskService.removeTask`

### 2.1 Insertar en `deletedTasks` antes de borrar localmente

Antes de intentar el borrado en el API, se guarda la tarea en `deletedTasks` como respaldo:

```js
export async function removeTask(id) {
  const task = tasks.find((t) => t.id === id);

  // Quitar de memoria y de la tabla local tasks
  tasks = tasks.filter((t) => t.id !== id);
  await dbDeleteTask(id);

  // Solo intentar el API si el id ya es del servidor (no local)
  if (!String(id).startsWith("t_")) {
    // Insertar en deletedTasks ANTES de intentar el borrado en API
    if (task) await dbInsertDeletedTask(task);
```

### 2.2 Si el delete en el API es exitoso: borrarlo de `deletedTasks`

```js
    try {
      await apiDeleteTask(id);
      // API exitoso: limpiar de deletedTasks
      await dbRemoveDeletedTask(id);
```

### 2.3 Si el delete en el API falla: dejar la tarea en `deletedTasks`

```js
    } catch (error) {
      // API falló: se deja en deletedTasks para reintentar luego
      console.error("No se pudo eliminar en backend, queda en deletedTasks", error);
    }
  }

  return [...tasks];
}
```

**Flujo completo:**
```
removeTask(id)
  → borrar de memory + tasks (local)
  → dbInsertDeletedTask(task)       ← respaldo offline
  → apiDeleteTask(id)
      ✓ éxito  → dbRemoveDeletedTask(id)   ← limpia deletedTasks
      ✗ falla  → queda en deletedTasks     ← se reintenta en sync
```

---

## 3. Modificar `taskService.syncPendingTasks`

### 3.1 Consultar todos los registros en `deletedTasks` y reintentar el borrado en el API

Al final del ciclo de sincronización normal, se agrega un segundo bloque que lee todos los registros pendientes de `deletedTasks`:

```js
// Reintentar borrados pendientes en deletedTasks
const deletedPending = await dbGetAllDeletedTasks();

for (const task of deletedPending) {
```

### 3.2 Si es exitoso: borrar de `deletedTasks`

```js
  try {
    await apiDeleteTask(task.id);
    // Exitoso: limpiar de deletedTasks
    await dbRemoveDeletedTask(task.id);
```

### 3.3 Si falla: atrapar la excepción y dejar el registro

```js
  } catch (error) {
    // Falló: se deja en deletedTasks, se reintentará en la próxima sync
    console.error("No se pudo reintentar borrado en API, se deja en deletedTasks", error);
  }
}
```

**Flujo completo:**
```
syncPendingTasks()
  → sincronizar tasks pendientes (create/update) — lógica preexistente
  → dbGetAllDeletedTasks()
      for each tarea pendiente:
        → apiDeleteTask(task.id)
            ✓ éxito  → dbRemoveDeletedTask(task.id)
            ✗ falla  → excepción atrapada, queda en deletedTasks
```

---

## Verificación en DevTools

### Estado offline — tarea en `deletedTasks`

Con el backend apagado, al borrar una tarea:
- La tarea desaparece de la UI y de `tasks` en IndexedDB
- El registro queda guardado en `deletedTasks`
- En consola aparece: `No se pudo eliminar en backend, queda en deletedTasks`

### Estado online — sync exitoso

Al volver a encender el backend y hacer click en **Sincronizar**:
- `syncPendingTasks` consulta `deletedTasks`
- Reintenta `apiDeleteTask` por cada registro
- Al recibir respuesta exitosa, borra el registro de `deletedTasks`
- `deletedTasks` queda vacío: `No data present for selected host`

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `db.js` | `DB_VERSION` 1 → 2, nuevo store `deletedTasks`, funciones `dbInsertDeletedTask`, `dbGetAllDeletedTasks`, `dbRemoveDeletedTask` |
| `taskService.js` | `removeTask`: insertar en `deletedTasks` antes del delete API, limpiar si exitoso |
| `taskService.js` | `syncPendingTasks`: bloque adicional para reintentar borrados pendientes |
