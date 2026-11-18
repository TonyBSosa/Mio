# Configuración de comprobantes privados — incremento 2D

Estado: integración preparada y probada con almacenamiento simulado; no se creó un proyecto ni bucket real. No se modificó `.env`, Render ni Atlas. Las escrituras de comprobantes siguen limitadas al entorno de pruebas aislado de 2C hasta validar la configuración externa completa.

## Elección

Se propone Supabase Storage con un bucket privado dedicado. Permite usar almacenamiento de objetos independiente de Render, conservar MongoDB como base del dominio y entregar acceso temporal después de comprobar la propiedad en Express. Un [bucket privado requiere autorización o URL firmada](https://supabase.com/docs/guides/storage/buckets/fundamentals); el frontend no recibe claves del servicio.

No se guardan imágenes en documentos MongoDB ni en el disco de Render. La API usa buffers de memoria limitados para validar y normalizar una imagen antes de subirla; los metadatos de MongoDB conservan su clave privada y su historial. Las URLs firmadas se generan por 60 segundos y no se guardan en la base ([API de firma](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)).

## Crear el almacenamiento

1. Crear o seleccionar un proyecto Supabase de pruebas, preferentemente dedicado a estos comprobantes. Usar una región cercana al backend y revisar las condiciones del plan antes de contratar recursos.
2. En **Storage → New bucket**, crear `mio-comprobantes-pruebas`. Mantener **Public bucket desactivado**.
3. En las restricciones del bucket, limitar el tamaño a **5 MB** y MIME permitido a **`image/webp`**. La API acepta JPG/PNG/WebP de entrada y los convierte siempre a WebP sin metadatos antes de almacenarlos. Los límites del proyecto no deben ser menores que los del bucket. Ver [creación y restricciones oficiales](https://supabase.com/docs/guides/storage/buckets/creating-buckets).
4. No crear políticas de acceso directo para `anon` o usuarios del navegador. Esta aplicación no usa Supabase Auth: la autorización de comprador/vendedor sigue en Express mediante JWT y MongoDB.
5. Obtener la URL HTTPS del proyecto y una clave **exclusiva de servidor** con acceso administrativo al Storage. La variable del código se llama `SUPABASE_SERVICE_ROLE_KEY`; puede contener la clave heredada `service_role` del proyecto o una clave secreta de servidor compatible con el SDK. Nunca usar una clave publishable/anon para esta integración ni exponer una clave secreta en Angular. Supabase distingue [claves públicas y secretas](https://supabase.com/docs/guides/getting-started/api-keys).

El backend verifica que el bucket siga siendo privado antes de subir, firmar o eliminar archivos. Si es público o no puede verificarlo, falla sin entregar acceso ni afirmar que guardó el comprobante.

## Variables y ejecución local

Usar **Node 22 o superior** para el backend; se verificó con Node 24.14.0. El SDK instalado declara ese mínimo. Conservar la base habitual de desarrollo: para probar reservas/comprobantes usar otra instancia o base aislada con transacciones.

En el archivo privado `backend/.env` del entorno aislado:

```dotenv
NODE_ENV=test
MONGO_URI=mongodb://127.0.0.1:27182/mio_pruebas_piloto?replicaSet=mioPruebas
JWT_SECRET=UN_SECRETO_PROPIO_DEL_ENTORNO
RESERVAS_PRUEBA_HABILITADAS=true
RESERVAS_PRUEBA_VENDEDORES=ID_REAL_DEL_VENDEDOR_DE_PRUEBA
SUPABASE_URL=https://ID-DEL-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=CLAVE_PRIVADA_DEL_SERVIDOR
SUPABASE_COMPROBANTES_BUCKET=mio-comprobantes-pruebas
```

La URL MongoDB de ejemplo exige un replica set ya iniciado; no convierte un standalone ni migra datos. Crear las cuentas de comprador y vendedor en esa base aislada y copiar el ID del vendedor a la lista permitida. No colocar cuentas ni claves reales en archivos versionados. Reiniciar la API después de cambiar variables. El frontend conserva su URL de API, sin configuración de Supabase ni claves nuevas.

Instalar con `npm ci` desde `backend` para que sharp instale el binario apropiado al sistema. El paquete de backend y el lockfile incluyen multer, sharp y el SDK Supabase. No copiar `node_modules` de Windows a Render/Linux.

## Render / Atlas y ejecución sin tráfico

La implementación no abre confirmaciones ni pagos en producción automáticamente. Para una futura validación desplegada, preparar primero un servicio **de pruebas**, base Atlas `mio_pruebas_*` y bucket de pruebas; configurar las tres variables Supabase solo en el backend. Atlas debe permitir las conexiones de ese servicio y soportar transacciones. Mantener separadas claves, cuentas y bases de producción.

`npm run reservas:expirar` procesa vencimientos y luego limpia cargas fallidas. Debe ejecutarse periódicamente desde un proceso externo si se requiere hacerlo sin tráfico. Usar el mismo entorno aislado y variables privadas. No se creó un cron ni se publicó el servicio en esta entrega.

Una carga en curso tiene una concesión máxima de 2 minutos y no pausa el vencimiento de la reserva. Las cargas abandonadas pasan a fallidas. La limpieza elimina objetos de esas cargas de forma idempotente y repite los intentos en ejecuciones posteriores, para cubrir una carga remota que terminó tarde tras un timeout. Conserva los metadatos de auditoría; no elimina comprobantes recibidos, aprobados o rechazados.

## Prueba real pendiente antes de habilitar uso habitual

Con imágenes ficticias, comprobar carga y vista previa, recepción, acceso privado del comprador y vendedor, rechazo de cuenta ajena, URL firmada vencida y fallo si el bucket se vuelve público. Aprobar un pago de prueba y comprobar un solo pedido/totales, rechazar y reenviar dentro de 24 horas, verificar expiración al finalizar la corrección y ejecutar el barrido externo. Registrar los resultados sin publicar archivos, claves o URLs firmadas.

Todavía no se ejecutó esta prueba contra Supabase real ni se habilitó producción. La integración requiere ese cierre operativo y una decisión explícita sobre activación, retención de comprobantes y recuperación de errores. No se implementaron conexión bancaria, OCR, pasarela, correos ni fotografías de chat/live.
