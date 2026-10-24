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

## Variables para Render

En el servicio de API configura `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` y `NODE_ENV=production`. El servidor escucha siempre el puerto provisto por `PORT`.
