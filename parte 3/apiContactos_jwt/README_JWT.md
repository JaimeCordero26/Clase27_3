# API Contactos con JWT

Este proyecto aplica los cambios solicitados por el taller:

- JWT en Program.cs
- User.cs
- PasswordHasher.cs
- AuthRepository.cs
- AuthController.cs
- ContactsController protegido con [Authorize]
- appsettings.json con JwtKey
- archivo jwt_tables.sql con las tablas users y refresh_tokens

## Pasos recomendados
1. Ejecute el script base de contactos.
2. Ejecute `jwt_tables.sql`.
3. Ejecute:
   ```bash
   dotnet restore
   dotnet build
   dotnet run
   ```
4. Abra `/swagger`.
5. Registre un usuario con `POST /auth/register`.
6. Haga login con `POST /auth/login`.
7. Copie el `accessToken`.
8. Use `Authorize` en Swagger y pruebe los endpoints de contactos protegidos.
