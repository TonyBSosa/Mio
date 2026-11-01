# Bitácora de semana 3

Fecha: 1 de noviembre de 2026, Honduras. Entrega: **Datos reales**. Esta versión documenta el modelo y verifica el recorrido existente; no presenta una migración o funciones financieras como implementadas.

## Objetivo y material revisado

Preparar `docs/modelo-datos.md` con diagrama Mermaid del producto completo, cardinalidades, diccionario, identificadores, referencias, unicidad, obligatoriedad, reglas de valores y comportamiento al borrar. Se revisaron la captura de fase 0 y las seis capturas incluidas en el documento del módulo aportado por el responsable: entidades/relaciones, integridad, normalización, migraciones y flujo central. Las diapositivas ocultas de los carruseles no se presentan como revisadas.

## Cambios de esta entrega

- Modelo físico de las seis colecciones actuales y sus 65 campos Mongoose, incluidos campos internos y timestamps.
- Diagrama adicional del producto completo: añade abonos, cancelaciones, entregas y auditoría de acceso como diseño futuro.
- Diccionario que distingue validación de formulario/servicio/ODM e índices del motor. Las referencias de Mongoose no se presentan como FOREIGN KEY.
- Reglas propuestas de integridad financiera, conservación histórica, dinero exacto y fechas; registro explícito de brechas actuales.
- Guía de repaso en `docs/academico/PREPARACION_RETO_MODULO_3.md`.
- Ajuste del plan del curso: MVP con usuarios en semana 5 y mejoras según piloto en semana 6; aplicación completa del alcance en semana 10.
- README con enlaces de la entrega; release identificado como `semana-3`.

## Flujo central observado en producción

Se usó la sesión de vendedor de prueba previamente abierta por el responsable. Se crearon datos ficticios sin teléfono/dirección reales ni credenciales en evidencias. La API tardó inicialmente en completar las solicitudes; se esperó su respuesta y no se declaró éxito durante el estado de carga.

| Paso | Resultado observado |
|---|---|
| Crear pieza `M3-PIEZA-001` por L300 | Disponible en selector de piezas del pedido |
| Crear `Cliente ficticio M3` | Guardado y disponible al crear pedido |
| Seleccionar cliente y pieza, venta directa, cantidad 1 | Pedido registrado con anotación «PRUEBA FICTICIA MODULO 3 - sin pago real» |
| Recargar pedidos y buscar `M3-PIEZA-001` | Un pedido conservado, cliente y pieza identificables, L300, pago y entrega pendientes |
| Revisar selector de piezas activas tras recarga | Ya no incluye la pieza apartada; conserva otra pieza activa preexistente |
| Confirmar pago y entrega ficticios | Mensajes de actualización y estados pagado/entregado |
| Abrir resumen general de la tienda | 1 pedido; L300 vendido, L300 pagado, L0 pendiente; 1 entregado, 0 por entregar |

Es un flujo sobre persistencia real usando datos de prueba; no hubo cobro ni entrega física reales. La captura de resumen se conserva localmente para revisión y no forma parte de los archivos publicados. No se borraron datos preexistentes. El recorrido confirma persistencia y resumen básico; no demuestra ausencia de toda condición de carrera o vulnerabilidad.

## Verificaciones técnicas

- `npm test` en backend: cinco pruebas aprobadas, cero fallos; repositorios simulados, sin certificar servidor MongoDB real.
- `npm run build` en frontend: aprobado.
- Inspección de esquemas cargados con Node/Mongoose sin conexión: se comprobó que el documento menciona los 65 campos de las seis colecciones y que sus enlaces locales resuelven. Dos bloques Mermaid ER identificados; esta comprobación textual no acredita render visual.
- Frontend y API públicos respondieron HTTPS 200 durante esta preparación.
- Historial previo a esta entrega: 20 commits totales, seis recientes; el requisito de la captura es ≥15 totales y ≥3 en los últimos diez días. La publicación añade el commit de semana 3, sin alterar fechas históricas.
- Token conservado en README: `LEARN-CAP-D03DECFA`.

## Límites y siguiente trabajo

MongoDB continúa como motor. No se creó historial de migraciones ni seed automatizado, no se instalaron validadores de colección y no se verificó restauración. La sección de migraciones del modelo es un procedimiento propuesto, no evidencia de ejecución. El Number monetario, referencias sin FK y reserva/creación en escrituras separadas siguen siendo brechas explícitas antes de abonos o piloto financiero. Los nuevos diagramas no implican implementación de HU-12 a HU-18.

La modificación previa de `docs/bitacora/semana-1.md` se conserva fuera de esta entrega. Las capturas extraídas del documento del curso se mantienen como material local, no se publican en GitHub. Documentación preparada con asistencia de IA; el responsable debe comprender y resolver individualmente la fase evaluada.

## Identificación de la versión

Los archivos obligatorios se publican juntos en `main`. El [release semana-3](https://github.com/TonyBSosa/Mio/releases/tag/semana-3) identifica el commit de esta entrega y permite comprobar el modelo y esta bitácora en esa versión. No se reutiliza ni se mueve la etiqueta semana-2.
