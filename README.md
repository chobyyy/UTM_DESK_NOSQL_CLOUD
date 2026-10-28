# UTM Desk NoSQL Cloud

Mesa de ayuda universitaria para registrar, atender y analizar incidencias de Cómputo y Telecomunicaciones, Infraestructura y Servicios Académicos.

## Estructura

- `apps/api`: API REST con Express y MongoDB/Mongoose.
- `apps/web`: interfaz React + Vite.

## Inicio local

1. Copia `apps/api/.env.example` a `apps/api/.env` y completa `MONGODB_URI` y `JWT_SECRET`.
2. Instala dependencias con `npm install`.
3. Ejecuta `npm run dev`.

La API queda en `http://localhost:4000/api` y Vite normalmente en `http://localhost:5173`.

Mantén una sola instancia de la API: usa `npm run dev` para iniciar ambos servicios, o `npm run dev:api` y `npm run dev:web` en dos terminales. Para reiniciar la API, primero detén su proceso con `Ctrl+C` en la terminal donde está ejecutándose. El error de puerto 4000 ocupado indica que ya existe un proceso escuchando allí.

El inicio de sesión y el registro de incidencias requieren la API y MongoDB activos. No se crean sesiones ni cuentas simuladas cuando el servidor está apagado. Una sesión antigua de demostración requiere volver a iniciar sesión.

Si el frontend abre pero no guarda reportes, comprueba `http://localhost:4000/api/health` y revisa la terminal de la API. El archivo de configuración debe llamarse exactamente `apps/api/.env` (no `.env.txt`); `.env.example` es solo una plantilla. La API carga ese archivo independientemente de la carpeta desde la que se ejecute.

Los alumnos solo necesitan indicar título, descripción y ubicación del problema. Las fotos son opcionales; los inventarios, direcciones IP y evaluaciones técnicas no son requisitos para registrar una incidencia.

Si MongoDB rechaza el registro con `Document failed validation` (código 121), ejecuta una vez `npm run migrate:ticket-validator --workspace=@utm-desk/api`. La migración admite el documento del formulario actual y las fotos JPEG, PNG y WebP, conserva el contrato anterior para los expedientes existentes y mantiene la validación en `strict`/`error`. Antes del cambio guarda un respaldo en `apps/api/.validator-backups/` con el comando para restaurar el validador original. No modifica ni elimina incidencias.

`npm run test:mongodb --workspace=@utm-desk/api` verifica el registro con y sin fotos contra MongoDB real usando una colección temporal que elimina al terminar; requiere `apps/api/.env` y permisos para crear y eliminar esa colección.

## Variables para Render

En el servicio de API configura `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` y `NODE_ENV=production`. El servidor escucha siempre el puerto provisto por `PORT`.
