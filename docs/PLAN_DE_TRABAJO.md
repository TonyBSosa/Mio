# MIO: plan de ocho semanas para graduación y piloto comercial

Inicio propuesto: 8 de octubre de 2026. Cierre interno: 2 de diciembre. El estudiante confirmó que todavía no existen fecha de entrega ni lineamientos de la universidad; este calendario es una meta de preparación, no un compromiso académico definitivo. Respondió «algunas 2 horas» a la pregunta de disponibilidad semanal y que el desarrollo será mayormente con IA: se interpreta provisionalmente como unas 2 horas semanales del estudiante. Ajustar alcance y documentación cuando se publique la rúbrica. El plazo es una meta condicionada a ejecución continua con IA, revisión humana y pruebas; no una garantía de finalización.

## Entregable y alcance

Aplicación web para una tienda pequeña que vende piezas únicas por redes sociales: identificar productos, registrar apartados, consolidar pedidos por cliente, registrar abonos, conocer saldos y controlar entregas. Angular, Express y MongoDB existentes. Los lives son eventos asociados a enlaces externos; MIO no aloja video. El cliente inicial propuesto es una tienda de ropa de segunda mano de Honduras.

Quedan fuera del compromiso de ocho semanas: marketplace, seguidores, recomendaciones, captura automática de comentarios, pasarelas de pago, facturación de membresías y transmisión de video. Un registro de abono representa una confirmación manual de la tienda, no un cobro procesado por MIO. La comercialización es una hipótesis que debe probarse, no una consecuencia garantizada del proyecto académico.

## Calendario y criterios de cierre

| Semana | Fechas | Trabajo | Evidencia para darla por terminada |
|---|---|---|---|
| 1 | 8–14 oct. | Confirmar rúbrica, entrevistar 2 tiendas, fijar requisitos y datos; códigos de piezas; documentar cómo ejecutar | Alcance acordado, entrevistas reales sin datos sensibles, piezas identificables y buscables |
| 2 | 15–21 oct. | Vincular pedidos a productos por ID; garantizar apartado sin duplicación; cerrar vías de edición que rompen reservas | Dos intentos simultáneos sobre una pieza: solo uno obtiene el apartado; acceso aislado entre tiendas |
| 3 | 22–28 oct. | Captura ágil, cliente y pedidos consolidados; precio histórico; validar cantidades para piezas únicas | Cliente con varias piezas y total correcto; cambios futuros de precio no alteran pedidos previos |
| 4 | 29 oct.–4 nov. | Registro de abonos, fecha/método/referencia, saldo calculado; correcciones trazables | L500 menos L200 da L300; rechazo de importe inválido o mayor al saldo; corrección conserva historial |
| 5 | 5–11 nov. | Cancelación y liberación de pieza; entrega y fecha; reglas para pedidos con abonos | Cancelar no borra historial; dinero recibido conserva tratamiento explícito; entrega cumple regla acordada |
| 6 | 12–18 nov. | Resúmenes de reservado/cobrado/pendiente, exportación CSV, uso móvil y revisión de acceso | Totales conciliados contra pedidos/abonos; exportación segura; otra tienda no accede por URL ni API |
| 7 | 19–25 nov. | Publicación piloto, configuración de entorno, copia/restauración y pruebas con tiendas | Flujo real probado por 1–2 tiendas; registro de fallos; restauración demostrada; medición de utilidad |
| 8 | 26 nov.–2 dic. | Corregir fallos, cerrar funciones y preparar memoria, manuales, diagramas y defensa | Aplicación demostrable, documentación consistente y guion ensayado; margen para imprevistos |

No mover trabajo a la siguiente semana sin mostrar el flujo funcionando. Si falta tiempo, reducir presentación y funciones opcionales antes de comprometer reservas, dinero, separación entre tiendas o documentación obligatoria. Congelar funciones al comenzar la semana 7. Reservar aproximadamente 25% del esfuerzo de ejecución a pruebas, documentación y correcciones. Si la disponibilidad humana limita entrevistas o pruebas, avanzar primero con una sola tienda y aplazar mejoras visuales y acceso opcional del comprador; no presentar un piloto sin realizarlo.

## Sesión humana semanal de dos horas

- 20 minutos: fijar prioridad y resolver reglas del negocio o dudas académicas.
- 60 minutos: probar el incremento, reproducir fallos y pedir correcciones a las herramientas.
- 20 minutos: revisar documentación y explicar con palabras propias el flujo implementado.
- 20 minutos: contactar tienda, observar uso o preparar la demostración.

Codex y Antigravity realizan implementación y documentación en sesiones dirigidas; no asumir trabajo automático en segundo plano. El estudiante debe poder explicar el código y revisar las reglas de su universidad sobre uso de IA cuando estén disponibles. Si las dos horas incluyen también toda la ejecución de las herramientas, el calendario probablemente necesitará ampliarse o recortarse.

## Hoy: primer avance

Se añadió código opcional de pieza: normalizado a mayúsculas, 1–30 caracteres (letras, números, guiones o guiones bajos), generado automáticamente para altas que lo omiten. Índice único por vendedor y código; los registros antiguos sin código siguen admitidos. La pantalla Productos permite asignarlo, editarlo, verlo y buscarlo. Un código ocupado devuelve conflicto en lugar de un error genérico.

Verificación realizada: pasó `node --test test/producto-codigo.test.js` desde backend y pasó `npm run build` desde frontend. La prueba del servicio utiliza repositorios simulados y verifica la definición del índice, no su funcionamiento en una base real. Estas pruebas no sustituyen la validación contra MongoDB ni la prueba de navegador. Antes del piloto comprobar que el índice compuesto existe en la base elegida, especialmente si la creación automática de índices está deshabilitada. No se ejecutó migración masiva ni se modificaron datos existentes.

Prueba manual pendiente: crear BLUSA-001; buscar por código; editar descripción; intentar otra pieza con el mismo código (debe rechazarla); usar el mismo código en otra tienda (debe permitirlo); crear sin código (debe generarlo); abrir un producto antiguo y asignarle código.

## Riesgo técnico prioritario

Hoy el frontend guarda pedido y luego marca producto apartado mediante otra petición. Eso puede dejar datos inconsistentes y permitir dos pedidos para una pieza. No presentar este comportamiento como reserva garantizada. La semana 2 deberá elegir y probar una operación consistente según el despliegue de MongoDB; si se usan transacciones, comprobar soporte de réplica. Cubrir también cancelación, errores intermedios y todos los caminos de creación/edición.

## Trabajo del estudiante

Confirmar fecha/rúbrica y tiempo semanal; contactar tiendas; conseguir ejemplos anónimos de cómo registran apartados y abonos; acordar qué ocurre al cancelar después de un abono y cuándo se permite entregar. Preguntar frecuencia de pérdida de pedidos, duplicados y saldo incierto. Observar una sesión real antes de añadir funcionalidades.

Piloto: medir tiempo para registrar un pedido, errores detectados, saldos conciliados y uso repetido. Preguntar disposición a pagar después de uso real; no usar opiniones favorables como prueba de ventas. No fijar todavía precio definitivo ni membresías vitalicias.

## Coordinación con Antigravity

Usar el prompt de ANTIGRAVITY_DOCUMENTACION.md. Su primera tarea está limitada a docs/academico/: documentación sustentada en el código y requisitos propuestos, sin implementar módulos. Codex continúa con código y verificación. Revisar su entrega antes de aceptarla; no tratar texto generado como evidencia de entrevistas o pruebas. La tarea está preparada para envío manual, no despachada automáticamente.

Cada sesión termina con: cambios realizados, verificación real, pendientes, siguiente tarea y archivos asignados. Si dos herramientas deben programar simultáneamente, usar ramas/checkouts separados y revisar la integración antes de fusionar.
