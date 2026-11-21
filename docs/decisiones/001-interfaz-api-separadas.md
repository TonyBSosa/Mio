# ADR 001 — Mantener Angular y Express como despliegues separados

Fecha de registro: 20 de noviembre de 2026. Estado: documenta la solución existente; no es una migración realizada hoy.

## Contexto

MIO ya tiene una interfaz Angular y una API Express que atiende diferentes roles y valida propiedad de tienda. La interfaz necesita una URL pública de API, mientras que la conexión a MongoDB y los secretos solo deben estar disponibles en servidor.

## Decisión

Mantener la interfaz estática y la API como dos unidades de despliegue, conservando reglas de negocio en servicios del backend y acceso a datos en repositorios. Configurar la URL pública en el build de Angular y los secretos mediante variables privadas de la API.

## Alternativas consideradas

- Servir Angular desde Express: simplificaría origen y despliegue, pero acoplaría las publicaciones de interfaz y API y requeriría cambiar la configuración actual.
- Acceder a MongoDB desde el navegador: obligaría a exponer acceso a datos o crear otro sistema de autorización; se descarta para preservar el control de permisos en servidor.
- Dividir cada funcionalidad en microservicios: agregaría despliegues y coordinación sin una necesidad acreditada por el alcance actual.

## Consecuencias

Se pueden construir y publicar ambas piezas por separado y se centralizan permisos y reglas en API. A cambio hay que mantener CORS, compatibilidad de contratos y dos configuraciones de despliegue; un frontend disponible no garantiza que la API esté despierta o funcionando.

La separación física no implica inversión de dependencias completa: `pedidoService` importa Mongoose y el backend sigue organizado por tipo. Es deuda explícita, descrita en [arquitectura](../arquitectura.md).

## Evidencia

`frontend/src/app/services/`, `backend/server.js`, `backend/src/expressApp.js`, `backend/src/services/pedidoService.js`, `backend/src/repositories/pedidoRepository.js` y [publicación](../PUBLICACION.md).
