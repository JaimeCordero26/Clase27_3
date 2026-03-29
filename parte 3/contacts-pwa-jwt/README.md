# Contacts PWA JWT

PWA sencilla para:
- login y obtención de access token / refresh token
- listado de contactos
- agregar contacto
- borrar contacto
- refrescar listado
- refrescar token
- logout

## Requisitos
1. Tener corriendo el API de contactos con JWT.
2. Servir esta carpeta con un servidor HTTP, por ejemplo:
   ```bash
   http-server -p 8080
   ```

## URL del API
Por defecto usa:
- `http://localhost:5013`

Puede cambiarla desde la pantalla de login.

## Flujo de uso
1. Abrir `login.html`
2. Iniciar sesión
3. Se redirige a `contacts.html`
4. Probar:
   - cargar contactos
   - agregar
   - borrar
   - refrescar token
   - logout

## Importante
Si el navegador bloquea las llamadas, el API necesita CORS habilitado para:
- `http://localhost:8080`
- `http://127.0.0.1:8080`
