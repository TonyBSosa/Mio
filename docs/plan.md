# Plan de diez semanas de MIO

Plan del curso, preparado el 1 de noviembre de 2026. Semanas relativas al curso: no se asignan fechas académicas no confirmadas. Este documento rige la entrega del módulo 2; el plan anterior de ocho semanas en PLAN_DE_TRABAJO.md se conserva como antecedente del piloto, no como calendario simultáneo.

## Meta y recorte

MVP: un vendedor identifica una pieza, registra un cliente y su apartado, confirma pago total y entrega y consulta pendientes; un administrador puede gestionar el acceso. El comprador utiliza los canales sociales existentes. Historias MVP: HU-01 a HU-11. No se requiere completar las once en semana 2: se exige la primera historia viva y se planifica el resto.

Segundo corte: HU-12 a HU-16 y HU-18, condicionado a validar reglas y capacidad disponible. HU-17 (catálogo público) se difiere pese a tener código exploratorio. Fuera del compromiso: marketplace, video, lectura automática de comentarios, pasarela, membresías y facturación tributaria.

La migración a PostgreSQL está recomendada para evaluar antes de abonos, pero no se ha aprobado ni ejecutado como parte de esta entrega. Se mantiene MongoDB para verificar semana 2. La semana 3 debe cerrar la decisión con costo, modelo y prueba; si se elige migrar, ajustar el plan y demostrar equivalencia antes de añadir funciones.

## Entrega semanal

| Semana | Meta observable | Historias / trabajo | Evidencia de cierre |
|---|---|---|---|
| 1 | Explicar problema y tener prototipo público | Visión, hipótesis, ejecución y alcance | README, docs/vision.md, bitácora; entrevistas pendientes, no presentarlas como realizadas |
| 2 | Primera historia identificable en línea | HU-01; mapa, ≥15 Issues, MVP etiquetado, este plan | Prueba de código/búsqueda/duplicado en producción y teléfono, commit que cierre issue, release semana-2, bitácora |
| 3 | Preparar datos y acceso aislado | HU-02, HU-03, HU-10; decisión de persistencia | Registro/login, dos tiendas aisladas; decisión documentada; si se migra, respaldo, restauración y regresión |
| 4 | Registrar una venta directa coherente | HU-04, HU-05 | Dos intentos simultáneos sobre una pieza: solo uno crea pedido; fallo intermedio no deja reserva huérfana; precio histórico |
| 5 | Completar recorrido MVP | HU-06 a HU-09, HU-11 | Pedido con/sin live, pago total, entrega, resumen conciliado y administración de acceso |
| 6 | Validar MVP con una tienda y corregir | Todas las MVP; observar cinco registros | Tiempo y errores reales, uso móvil, entrevistas y cambios sustentados; confirmar reglas del corte 2 |
| 7 | Registrar abonos trazables | HU-12 y HU-14 | L500 − L200 = L300, rechazo de exceso, consolidado conciliado; condicionado a regla validada |
| 8 | Resolver cancelación y entrega con historial | HU-13 y HU-15 | Cancelación conserva dinero/historial y libera pieza; regla de entrega probada |
| 9 | Facilitar revisión y recuperación | HU-16 y HU-18 según capacidad; seguridad, copia/restauración | CSV conciliado, acceso restringido, restauración demostrada; aplazar auditoría ampliada si compite con MVP |
| 10 | Estabilizar y demostrar | Correcciones, manual y demostración | Recorrido completo en HTTPS/teléfono, evidencias, manual, release final y limitaciones declaradas |

## Piso de aplicación completa

| Dimensión | Cómo se cubre |
|---|---|
| Recorrido útil | Preparar → apartar → cobrar → entregar → revisar, sin construir solo catálogo |
| Roles | Vendedor y administrador en MVP; comprador asistido por canal externo |
| Persistencia | Datos conservados tras recarga; restricciones y concurrencia comprobadas en base real |
| Seguridad | Autenticación, autorización en API y pruebas cruzadas de tiendas |
| Interfaz | Formularios, mensajes, estados vacíos/errores y flujo utilizable en teléfono |
| Operación | HTTPS público, configuración por entorno, copia/restauración y documentación |
| Calidad | Criterios verificables, regresión pertinente, bitácora y trazabilidad issue–commit–release |

## Priorización y capacidad

Primero corrección de reservas, aislamiento y recorrido completo. Después abonos e historial; al final catálogo público y mejoras opcionales. HU-01 es pequeña y demostrable, pero no sustituye el recorrido completo del MVP. Se aprovecha el código existente y se reserva aproximadamente 25% del esfuerzo para verificar y corregir.

La disponibilidad previa de unas dos horas semanales requiere confirmar viabilidad: si no alcanza, conservar el corte 1, mover corte 2 y documentar el ajuste. No reducir integridad ni fabricar evidencia para mantener el calendario. Revisar el plan cada semana con resultados del piloto y la rúbrica que publique el curso.
