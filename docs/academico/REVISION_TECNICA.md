# Revisión de la entrega de Antigravity

Se recibieron REQUISITOS.md, CASOS_DE_USO.md, MATRIZ_DE_TRAZABILIDAD.md y PREGUNTAS_PARA_TIENDAS.md. Son una base de trabajo, no una certificación del sistema ni resultados de entrevistas. Esta revisión delimita las afirmaciones que todavía requieren comprobación.

## Correcciones y decisiones para la siguiente sesión

1. **Versiones:** se corrigió el encabezado de requisitos. Mongoose 9 es la versión del ODM; no demuestra que el servidor sea MongoDB 9. Verificar la versión y topología del servidor sin divulgar credenciales.
2. **Reserva consistente:** una actualización condicional de Producto garantiza exclusión sobre ese documento, pero no la creación conjunta de Pedido. Si falla guardar el pedido después de apartar, puede quedar una pieza bloqueada sin pedido. Elegir una transacción que incluya ambas escrituras si el despliegue la admite, o diseñar explícitamente recuperación, idempotencia y reconciliación. No presentar ambas alternativas como equivalentes. Todos los filtros deben incluir vendedorId.
3. **Unicidad de códigos:** RF-05 tiene código e índice definidos; la existencia efectiva del índice y su funcionamiento en MongoDB siguen pendientes. Las pruebas actuales del servicio usan repositorios simulados. Probar duplicados en una tienda y el mismo código en tiendas distintas contra una base de pruebas.
4. **Estados de producto:** no está aprobada la ampliación a cinco estados. Conservar por ahora activo/inactivo/apartado y definir qué estado pertenece a la pieza, al pedido, al pago y a la entrega antes de duplicar información. No renombrar activo a disponible sin revisar compatibilidad y datos existentes.
5. **Pedidos históricos:** agregar productoId no debe invalidar ni vincular automáticamente por nombre los pedidos antiguos. Distinguir pedidos heredados sin referencia; exigir referencia validada para nuevas reservas de piezas. El nombre y precio del pedido pueden conservarse como datos históricos.
6. **Abonos:** elegir inicialmente un único nivel de registro (por pedido), con vista consolidada por cliente. Cobrar por paquete y distribuir dinero entre piezas es una extensión que necesita reglas adicionales. Usar representación monetaria exacta, validar importes finitos y cubrir dos abonos simultáneos para evitar exceder el saldo.
7. **Cancelaciones:** entrevistar dos tiendas no establece una política universal. No implementar crédito interno, penalizaciones o devoluciones automáticas por mayoría de respuestas. Elegir un flujo mínimo acordado y registrar explícitamente la resolución; no confundir una devolución pendiente con dinero ya devuelto.
8. **Alcance:** usuario de red social, expiración, comprobante adjunto, seguimiento de mensajería y texto para WhatsApp son propuestas opcionales. No deben desplazar reserva consistente, abonos, cancelación, entrega y documentación obligatoria.
9. **Seguridad y evidencia:** RF-02 refleja filtros existentes en repositorios, pero requiere pruebas de acceso entre tiendas para sostener la afirmación completa. updatedAt no es historial de auditoría ni conserva el responsable de cada movimiento. “Implementado” significa código presente; “verificado” requiere evidencia de ejecución distinta.
10. **Precisión del informe:** el borrado actual usa findOneAndDelete con filtro de vendedor, no findByIdAndDelete. El problema de eliminación destructiva permanece. estadoPago es un enum de dos valores, no un booleano literal. Las referencias de líneas deberán actualizarse cuando cambie el código.

## Próximo incremento propuesto

Primero comprobar topología y soporte de transacciones en una base de desarrollo. Después implementar productoId, liveId opcional y una única operación backend para reservar y crear pedido; adaptar ambas pantallas de captura y proteger edición/cambio de estado/borrado frente a reservas activas. Verificar concurrencia, errores intermedios, reintentos y aislamiento de tiendas antes de avanzar a abonos. No migrar datos reales sin revisar previamente el plan de compatibilidad.

La investigación comercial sigue pendiente: el problema descrito en requisitos es una hipótesis hasta contar con observación o entrevistas registradas. La fecha académica y rúbrica tampoco están confirmadas.
