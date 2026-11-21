# ADR 002 — Almacenar comprobantes en un bucket privado

Fecha de registro: 20 de noviembre de 2026. Estado: implementada en código y pruebas; operación productiva pendiente.

## Contexto

Los comprobantes pueden contener información personal. El comprador y el vendedor propietario necesitan acceder a la imagen; guardar una URL pública permitiría acceso fuera de esas autorizaciones. MongoDB mantiene el historial de la reserva y el almacenamiento externo mantiene el archivo.

## Decisión

Usar Supabase Storage privado y guardar metadatos en MongoDB. Autorizar cada acceso en backend y emitir una URL firmada de 60 segundos. Validar y normalizar la imagen antes de guardarla; adjuntar una imagen no confirma el pago, que requiere revisión del vendedor.

## Alternativas consideradas

- Disco del servidor: introduce dependencia del almacenamiento local del despliegue y complica persistencia y escalado.
- Bucket público: simplifica visualización, pero no permite aplicar el control de acceso requerido a cada consulta.
- Imagen dentro del documento MongoDB: concentra datos y archivo, pero aumenta el tamaño de documentos y tráfico de la base; no es el diseño elegido.

## Consecuencias

Se evita publicar imágenes y la API decide quién puede abrirlas. A cambio se depende de otro proveedor y de su configuración privada. Una URL firmada puede compartirse durante su breve vigencia; no equivale a revocación inmediata.

MongoDB y Storage no comparten transacción: son necesarios registros de carga, recuperación y limpieza de intentos fallidos. Deben probarse fallos y reintentos sin dar un pago por recibido anticipadamente. Las escrituras permanecen restringidas a pruebas; este documento no autoriza habilitarlas en producción.

## Evidencia

`backend/src/services/comprobanteStorage.js`, `backend/src/services/comprobanteService.js`, `backend/test/comprobante-imagen-storage.test.js`, [incremento 2D](../incremento-2d-comprobantes.md) y [configuración](../COMPROBANTES_STORAGE.md).
