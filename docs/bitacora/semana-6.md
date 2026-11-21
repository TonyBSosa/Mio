# Bitácora — semana 6: segundo flujo y decisiones

Fecha: 20 de noviembre de 2026, America/Tegucigalpa. Responsable: Tony Sosa.

## Trabajo realizado

Se contrastaron las capturas del módulo con código, documentación, grafo existente y consultas de solo lectura a GitHub. Se creó `docs/arquitectura.md` con diagramas Mermaid de contexto y contenedores, capas, carpetas y límites reales. Se registraron tres decisiones con contexto, decisión, alternativas y consecuencias.

Tony eligió mejorar entregas: local específico o zona común, fecha y lugar. Se implementó un plan opcional por pedido y un diálogo para programar, reprogramar y confirmar recepción. El pago sigue separado. El servidor exige un plan antes de marcar una nueva entrega realizada y conserva compatibilidad con documentos históricos. No se modificó producción.

La organización por funcionalidad y la inversión de dependencias siguen incompletas; se documentó esta deuda sin afirmar una refactorización inexistente.

## Justificación del segundo flujo

La selección procede de la petición de Tony en esta conversación. Las sesiones reales del módulo 5 siguen sin documentarse; no se atribuyen comentarios ni resultados a participantes inexistentes. El flujo de comprobantes queda fuera de este incremento y mantiene sus restricciones de prueba.

## Verificación

- Historial local inicial: 39 commits; 9 desde el 11 de noviembre de 2026. No se crearon commits para inflar el conteo.
- README: token `LEARN-CAP-D03DECFA` presente.
- Web pública: HEAD devolvió HTTP 200 sobre HTTPS; no acredita el recorrido autenticado.
- Backend final: 40 pruebas, 33 aprobadas, 7 omitidas y 0 fallidas, incluyendo integración HTTP con MongoDB real aislado. Las omitidas requieren otros entornos de pruebas.
- Angular: compilación de producción correcta con `CI=true`, conservando optimización y presupuestos. La caché LMDB local provocaba cierre nativo de Node; se evitó solo para esta verificación. Hay advertencias de tamaño, sin errores.
- Navegador con API simulada y datos ficticios: rechazo de campos vacíos, programación de zona común, recarga, confirmación, retorno a pendiente y reprogramación a local. Inspección de escritorio y móvil de 390 × 844. Capturas en `docs/evidencias/semana-6/`.
- La integración HTTP con MongoDB temporal en el puerto 27196 verificó persistencia, roles, propiedad, reprogramación, pago intacto, pedidos cancelados y bloqueo de programación tardía tras confirmar. Se cerraron y eliminaron la instancia y sus archivos temporales; no se usó MONGO_URI. La recarga de navegador corresponde a la vista previa simulada. Producción sigue pendiente.
- GitHub: PR #19 y #20 mezclados con descripciones vacías; no acreditan los dos PR requeridos. Releases observados hasta `semana-5`, sin `semana-6`.

## Uso de IA y autoría

Se pidió ayuda para completar el módulo y después mejorar entregas con modalidad, lugar y fecha. La IA revisó código, redactó documentos, implementó la función y sus pruebas y ejecutó verificaciones locales. La selección del flujo y sus campos proceden de Tony. La fecha de calendario, separación del pago y compatibilidad histórica son decisiones propuestas por la IA, pendientes de revisión del responsable.

Se descartó presentar comprobantes como segundo flujo, contar PR vacíos como entregables completos o usar la simulación de usuarios como evidencia. El diálogo se separó en un componente para respetar el presupuesto de estilos. No se compartieron secretos ni datos reales de clientes con la vista previa. Tony debe revisar y poder explicar lo entregado.

## Pendientes

Vincular la mejora con un hallazgo real, verificar el recorrido en producción, integrar mediante dos PR con descripción e issues y publicar `semana-6` sobre la versión final. Ver [guía de entrega](../ENTREGA_SEMANA_6.md) y [flujo de entregas](../flujo-entregas.md).
