# Cómo funciona MIO

Empieza por [la vista explicativa](index.html). Tiene seis áreas desplegables y dos recorridos; el grafo técnico queda como material de consulta.

MIO organiza ventas de una tienda por redes sociales: quién compra, qué pieza pidió y si está pagada o entregada. La transmisión ocurre fuera de la aplicación. El código incluye un recorrido adicional de solicitudes de apartado y comprobantes, con operaciones restringidas a pruebas aisladas.

## La estructura en una frase

**Angular muestra las pantallas → Express aplica las reglas → MongoDB conserva los registros.** Los archivos privados de comprobantes se manejan mediante Supabase y sus referencias se guardan en MongoDB.

| Área | Qué hace | Con qué se relaciona |
|---|---|---|
| Acceso y permisos | Identifica comprador, vendedor o administrador y verifica su sesión | Todas las operaciones privadas |
| Catálogo y tienda | Presenta las piezas y la identidad pública del vendedor | Productos, apartados y pedidos |
| Clientes y lives | Organiza a quién se vende y el evento opcional | Pedidos y resúmenes |
| Pedidos | Registra la venta y separa pago de entrega | Clientes, piezas, live opcional y resumen |
| Apartados y comprobantes | Solicita, reserva y revisa evidencia de pago | Inventario, pedidos y expiración |
| Resúmenes y documentación | Explica resultados, decisiones y avances | Pedidos y evidencia del proyecto |

Estas seis áreas son una agrupación explicativa. No equivalen a seis servicios desplegados ni a seis comunidades calculadas por el algoritmo.

## Recorrido 1: el vendedor registra una venta

1. El vendedor prepara su cliente y su pieza. Puede tener un live activo.
2. Crea un pedido. El cliente es obligatorio; el live es opcional. Si selecciona uno, debe estar activo.
3. Si referencia una pieza del inventario, el servicio valida que pertenezca al vendedor y esté disponible, y trata de apartarla.
4. Da seguimiento al pago y a la entrega como estados independientes.
5. Las consultas de resumen usan los pedidos para presentar resultados.

También existe el registro con nombre de producto sin referencia a una pieza del catálogo. No todo pedido representa el mismo mecanismo de bloqueo de inventario.

**Dónde verlo:** [pedidoService.js](../backend/src/services/pedidoService.js), [pedidoRepository.js](../backend/src/repositories/pedidoRepository.js), [pedidos.js](../backend/src/models/pedidos.js).

## Recorrido 2: el comprador solicita un apartado

1. Explora un catálogo y, con sesión de comprador, solicita una pieza disponible. La solicitud queda pendiente.
2. El vendedor puede rechazarla; el código actual elimina esa solicitud pendiente. Si la confirma, la política de pruebas debe permitirlo.
3. La confirmación bloquea la pieza y establece el plazo configurado de 3 o 7 días.
4. El comprador sube un comprobante y el vendedor lo revisa manualmente. La carga y la revisión están restringidas al entorno de pruebas aislado. El primer rechazo permite una corrección dentro de 24 horas; el segundo deja la reserva sujeta al vencimiento.
5. Al aprobar, el servicio crea un pedido pagado con entrega pendiente dentro de una transacción y vincula cliente, pieza, solicitud y comprobante.
6. La lógica de expiración puede liberar una pieza cuya reserva de prueba venció sin comprobante recibido, siempre que el bloqueo siga correspondiendo a esa reserva y no exista un pedido asociado.

**Importante:** una solicitud pendiente no equivale a una reserva confirmada, y una reserva confirmada no equivale a una venta pagada. La presencia de pantallas no prueba que el recorrido esté habilitado en producción.

**Dónde verlo:** [solicitudApartadoService.js](../backend/src/services/solicitudApartadoService.js), [comprobanteService.js](../backend/src/services/comprobanteService.js), [expiracionReservasService.js](../backend/src/services/expiracionReservasService.js), [reservasPruebaPolicy.js](../backend/src/services/reservasPruebaPolicy.js).

## Tres distinciones que evitan confusiones

- **Cuenta y cliente comercial:** una cuenta de comprador permite entrar a MIO; un cliente del directorio es un registro de la tienda. No siempre representan una misma cuenta vinculada.
- **Pago y entrega:** un pedido puede estar pagado y pendiente de entrega. Son estados distintos.
- **Código y documentación:** hay requisitos, planes y diagnósticos históricos que no describen todos los incrementos actuales. Para confirmar comportamiento actual, lee primero servicio y modelo; usa el documento para entender la intención y la fecha.

## Cómo seguir una petición sin perderse

Para una operación común, sigue **pantalla → servicio Angular → ruta Express → controlador → servicio de negocio → repositorio/modelo**.

1. [app.routes.ts](../frontend/src/app/app.routes.ts) indica la pantalla y el rol que puede entrar.
2. Los archivos de [services](../frontend/src/app/services/) muestran las llamadas HTTP.
3. [expressApp.js](../backend/src/expressApp.js) reúne los prefijos de rutas de la API.
4. El controlador recibe la petición; el servicio de negocio valida y decide; el repositorio o modelo consulta y guarda.

La separación por capas no es uniforme: comprobantes usa los modelos directamente y autenticación concentra lógica en el controlador. El diagrama explica el patrón general, no una arquitectura idéntica en todos los módulos.

## El punto que conecta más recorridos

**La disponibilidad de una pieza** enlaza catálogo, pedido directo, confirmación, aprobación de comprobante y expiración. Cambiar un estado de producto requiere revisar todos esos recorridos.

La creación directa de pedidos utiliza escrituras separadas y compensación ante ciertos errores. La confirmación de reservas y aprobación de comprobantes usan transacciones en su recorrido habilitado. No debe generalizarse la garantía de un mecanismo al otro.

## Qué produjo este análisis y cuáles son sus límites

- Se procesaron **205 archivos** de `frontend`, `backend` y `docs`: 140 de código, 59 documentos/plantillas y 6 imágenes. Skills, temporales y dependencias quedaron fuera.
- El grafo tiene **1,521 nodos, 3,226 relaciones y 93 comunidades técnicas**. La vista explicativa agrupa el funcionamiento en seis áreas para evitar una pantalla saturada.
- Se leyeron completos los 59 textos y se inspeccionaron las seis imágenes. El grafo no representa 26 archivos de formatos sin extractor dentro del alcance, incluidos estilos; seis archivos de código detectados no produjeron símbolos AST.
- El diagnóstico no detectó extremos ausentes, referencias colgantes ni autoenlaces. El grafo simple sin dirección **colapsa 205 relaciones paralelas** entre los mismos extremos: pierde multiplicidad y parte del detalle de esas relaciones. Los enlaces inferidos son hipótesis estructurales, no pruebas de ejecución.
- El consumo real de tokens de los agentes no fue expuesto por la herramienta. Los ceros internos no significan extracción semántica gratuita ni ausencia de consumo.
- El benchmark estima 1,616 tokens por consulta y una reducción de 62.7 veces frente a lectura completa de su corpus de referencia. Es una estimación interna con preguntas de prueba, no una medición del ahorro real de esta sesión.
- No se ejecutaron pagos, solicitudes a producción, operaciones de base de datos ni comprobaciones del despliegue. Este trabajo documenta y relaciona el código; no modifica la aplicación ni certifica que cada función opere en producción.

**Archivos:** [vista explicativa](index.html), [informe técnico](GRAPH_REPORT.md), [grafo completo](graph.html), [datos consultables](graph.json), [diagnóstico](health.json).

`graphify-out/` se escribió en el árbol de trabajo y aparece en Git si no está ignorado. Puedes ignorarlo o compartir solo los archivos que necesite el equipo.

Para continuar, una buena pregunta es: **¿Cómo evita MIO que una misma pieza se venda mientras está reservada y qué ocurre cuando vence el plazo?**
