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

Si al crear una cuenta o iniciar sesión aparece un fallo de conexión SSL (`tlsv1 alert internal error`, `SSL alert number 80`), comprueba en MongoDB Atlas **Network Access → Add IP Address → Add Current IP Address → Confirm**. La IP que debe estar autorizada es la IP pública del equipo que ejecuta la API; puede cambiar al cambiar de red o usar una VPN. Espera a que la entrada esté activa y vuelve a intentar; si la API se detuvo, iníciala de nuevo. Si persiste, revisa también el firewall, la VPN y el estado del clúster. Mantén TLS y la validación de certificados activados.

`/api/health` comprueba MongoDB con un ping: devuelve HTTP 200 y `database: "connected"` cuando está disponible, o HTTP 503 y `database: "unavailable"` si no puede conectarse. El registro y el inicio de sesión también responden con un mensaje de base de datos no disponible cuando falla la conexión, sin mostrar detalles de OpenSSL en el formulario.

Los alumnos solo necesitan indicar título, descripción y ubicación del problema. Las fotos son opcionales; los inventarios, direcciones IP y evaluaciones técnicas no son requisitos para registrar una incidencia.

El reportante no selecciona la prioridad: la API crea los reportes con prioridad `media` inicial y rechaza ese campo en el registro. La coordinación puede asignarla desde la insignia de prioridad del detalle, que abre un modal pequeño, o al asignar un técnico. El cambio se guarda con su autor en el historial; cada coordinador solo modifica incidencias de sus áreas. El administrador conserva los permisos de gestión.

Si MongoDB rechaza el registro con `Document failed validation` (código 121), ejecuta una vez `npm run migrate:ticket-validator --workspace=@utm-desk/api`. La migración admite el documento del formulario actual y las fotos JPEG, PNG y WebP, conserva el contrato anterior para los expedientes existentes y mantiene la validación en `strict`/`error`. Antes del cambio guarda un respaldo en `apps/api/.validator-backups/` con el comando para restaurar el validador original. No modifica ni elimina incidencias.

`npm run test:mongodb --workspace=@utm-desk/api` verifica el registro con y sin fotos contra MongoDB real usando una colección temporal que elimina al terminar; requiere `apps/api/.env` y permisos para crear y eliminar esa colección.

La bitácora del técnico permite seleccionar o arrastrar hasta 3 evidencias por avance (JPEG, PNG, WebP, PDF, TXT o LOG, de hasta 2 MB cada una). Los archivos se guardan como datos binarios en `utm_desk.evidencias_tecnicas`, vinculados a la incidencia y al usuario que los subió; el ticket admite hasta 20 evidencias técnicas. Los adjuntos originales del reporte se conservan. La nota, el estado, las horas y los archivos se confirman en una transacción. La descarga requiere una sesión con acceso a la incidencia; las imágenes tienen vista previa en su detalle. El almacenamiento y su índice se crean en la primera carga, sin cambiar el validador de incidencias.

`npm run test:evidence --workspace=@utm-desk/api` comprueba cargas, descargas, permisos y reversión de la bitácora con MongoDB real. Usa dos colecciones temporales y las elimina al terminar.

El administrador puede cambiar entre los roles reportante, técnico y coordinador desde **Directorio de Usuarios → Cambiar rol**. Técnicos y coordinadores deben tener al menos un área autorizada; al elegir reportante se vacían esas áreas. El cambio se guarda en `usuarios` sin alterar contraseñas ni datos personales. Las cuentas de administrador conservan su rol. El usuario verá el panel nuevo al cerrar sesión y volver a entrar; la API comprueba el rol vigente en cada solicitud. `npm run test:roles --workspace=@utm-desk/api` verifica la persistencia contra el validador real en una colección temporal que elimina al terminar.

Desde el directorio, **Suspender → Confirmar suspensión** guarda `activo: false` en el usuario. La cuenta no puede iniciar sesión y las solicitudes con un token existente se rechazan mientras esté suspendida; al detectarlo, el frontend cierra su sesión. **Reactivar** restablece el acceso sin cambiar contraseñas, roles, áreas ni incidencias. Solo los administradores gestionan suspensiones y no pueden suspender su propia cuenta.

## Variables para Render

En el servicio de API configura `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` y `NODE_ENV=production`. El servidor escucha siempre el puerto provisto por `PORT`.
