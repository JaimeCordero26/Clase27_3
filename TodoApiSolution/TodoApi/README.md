# TodoApi (.NET + PostgreSQL + Dapper)

Backend base para el curso de PWA móvil. Su propósito es servir de API para la ToDo App.

## Stack
- ASP.NET Core Web API (.NET 8)
- PostgreSQL
- Dapper
- CORS habilitado para `http://localhost:8080`

## Endpoints
- `GET /tasks`
- `GET /tasks/{id}`
- `POST /tasks`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`

## Requisitos
- .NET 8 SDK
- PostgreSQL

## Configuración
La cadena de conexión está en `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=todo_app_db;Username=postgres;Password=postgres"
}
```

Ajuste usuario y contraseña según su entorno.

## Preparar la base de datos
1. Ejecute `Scripts/01_create_database.sql`
2. Conéctese a `todo_app_db`
3. Ejecute `Scripts/02_create_table_tasks.sql`
4. (Opcional) Ejecute `Scripts/03_seed_tasks.sql`

## Ejecutar
Desde la carpeta `TodoApi`:

```bash
dotnet restore
dotnet run
```

La API arrancará en:
- `http://localhost:5000`

Swagger:
- `http://localhost:5000/swagger`

## Ejemplos de requests

### GET /tasks
```bash
curl http://localhost:5000/tasks
```

### POST /tasks
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Nueva tarea\",\"done\":false}"
```

### PUT /tasks/{id}
```bash
curl -X PUT http://localhost:5000/tasks/11111111-1111-1111-1111-111111111111 \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Tarea actualizada\",\"done\":true}"
```

### DELETE /tasks/{id}
```bash
curl -X DELETE http://localhost:5000/tasks/11111111-1111-1111-1111-111111111111
```
