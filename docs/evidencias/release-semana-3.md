# Semana 3 — Datos reales

Modelo de datos de MIO con dos diagramas Mermaid: seis colecciones implementadas y diseño completo ampliado con abonos, cancelaciones, entregas y auditoría. Incluye diccionario de campos, cardinalidades, índices, referencias, obligatoriedad, reglas y tratamiento de borrado. Distingue las validaciones del ODM de las garantías de MongoDB.

- [Modelo y diccionario](https://github.com/TonyBSosa/Mio/blob/semana-3/docs/modelo-datos.md).
- [Bitácora y comprobaciones](https://github.com/TonyBSosa/Mio/blob/semana-3/docs/bitacora/semana-3.md).
- [Guía de estudio](https://github.com/TonyBSosa/Mio/blob/semana-3/docs/academico/PREPARACION_RETO_MODULO_3.md).
- App: https://mio-web.onrender.com

Flujo observado en producción con datos ficticios: cliente + pieza L300 → apartado directo → recarga → confirmación manual de pago y entrega → resumen conciliado con L300 pagado, L0 pendiente y una entrega. Sin transacciones monetarias reales.

Verificación: cinco pruebas backend aprobadas con mocks, compilación frontend aprobada y URLs HTTPS disponibles. Se revisó cobertura documental de 65 campos de los seis esquemas. El plan se ajustó a MVP con usuarios en semana 5.

Esta entrega modifica documentación, no el motor ni el esquema de producción. Migraciones reproducibles, validadores de colección, representación monetaria exacta, abonos y garantías transaccionales siguen pendientes. No certifica concurrencia o seguridad global; los diagramas futuros no son funciones implementadas.
