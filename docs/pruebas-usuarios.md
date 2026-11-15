# Pruebas con usuarios — MIO, semana 5

Preparado: 14 de noviembre de 2026. Responsable: Tony Sosa.

**Estado: guion listo; sesiones reales pendientes.** El ejemplo del final es una simulación para ensayar el registro. Sus participantes, tiempos y frases son inventados y no constituyen evidencia de validación ni testimonios reales.

## Qué queremos comprobar

Que una persona que vende piezas por redes pueda registrar un pedido y consultar sus estados sin perderse entre clientes, productos y pedidos. T1–T5 prueban funciones del vendedor; T6 explora el acceso del cliente al live y el respaldo de su apartado. El administrador no participa en este estudio: sus pruebas técnicas de permisos son una verificación distinta.

Se conservan las hipótesis y umbrales de [la semana 1](vision.md):

- **H2:** cinco registros con cliente y catálogo preparados, tras una explicación breve; mediana de 15 segundos o menos y ningún error de cliente o pieza en los cinco. Registrar aparte la preparación y comparar con el método habitual.
- **H3:** localizar correctamente pago y entrega de cinco pedidos sin consultar chats o anotaciones externas.
- H1 requiere entrevistas sobre casos concretos del último mes. H4 requiere un piloto en dos sesiones distintas. Una sesión de usabilidad no basta para cerrar ninguna de estas dos.

Aplicar H2 por participante vendedor y publicar también los resultados individuales. H3 requiere una prueba aparte, pues T6 ahora evalúa el recorrido del cliente. No sustituir los umbrales por «les gustó». La regla conjunta para declarar respaldo entre participantes debe fijarse antes de las sesiones; por ahora no se ha definido y no se emitirá una conclusión general.

## Participantes por reclutar

Buscar tres personas del segmento; ampliar a cinco si es posible. No reclutar amigos o compañeros por conveniencia. Los perfiles siguientes son criterios de búsqueda, no personas ya contactadas.

| Identificador previsto | Perfil buscado | Dispositivo |
|---|---|---|
| P1 | Persona que vende ropa por redes y lleva pedidos en cuaderno | Su teléfono habitual |
| P2 | Persona que toma pedidos mientras otra hace el live | Su teléfono o computadora habitual |
| P3 | Persona que vende por mensajes y revisa cobros y entregas | Su teléfono habitual |

Registrar solo experiencia aproximada, método actual, dispositivo, fecha, duración y consentimiento. No publicar nombres, teléfonos, correos ni credenciales. Si algún perfil no se consigue, documentar quién participó realmente sin completar la tabla con personas ficticias.

## Preparación y apertura

Duración prevista: 20–30 minutos por persona. Usar una tienda de prueba aislada, clientes ficticios y piezas distintas para no afectar ventas reales. Preparar cinco clientes, cinco piezas disponibles con códigos S5-01 a S5-05 y cinco pedidos adicionales con estados conocidos. Guardar la respuesta correcta de esos estados antes de empezar.

Abrir https://mio-web.onrender.com y comprobar acceso, carga de API y datos preparados antes de cronometrar. Anotar la versión o commit evaluado. No incluir el arranque de una API suspendida dentro del tiempo de captura; registrar esa espera por separado.

Texto propuesto para abrir la sesión:

> Gracias por ayudarme. Estamos probando la app, no a vos. Si algo no se entiende, me sirve saberlo. Decime en voz alta qué estás buscando y qué esperabas que pasara. ¿Está bien si tomo notas sin poner tu nombre? Podés parar cuando querrás.

No grabar por defecto. Si se decide grabar, pedir permiso específico y guardar el archivo de forma privada; no subir audio ni video al repositorio. No afirmar consentimiento ni grabaciones que no existan.

Dar la misma explicación breve a todos: MIO organiza clientes, piezas y pedidos; la venta se captura manualmente y el live ocurre fuera de MIO. No demostrar los pasos de las tareas. Si alguien se traba, preguntar «¿qué esperabas que pasara?». Registrar toda ayuda: completar con ayuda no cuenta como éxito independiente.

## Guion: seis tareas con metas

| Tarea | Lo que se le dice a la persona | Qué se mide / criterio |
|---|---|---|
| T1. Cliente | «Una compradora nueva te escribió. Guardá estos datos de prueba para encontrarla después». | Tiempo, dudas, errores y si el cliente correcto permanece al recargar. Es preparación; no entra en H2. |
| T2. Pieza | «Vas a vender esta blusa de L200. Dejala registrada con el código S5-NUEVA para reconocerla después». | Tiempo, comprensión del código, precio correcto y persistencia. Es preparación. |
| T3. Venta directa | «Estas cinco personas te pidieron estas cinco piezas por mensaje. Dejá cada pedido a nombre de quien corresponde, sin asociarlo a una transmisión». | Cinco intentos separados con clientes y piezas previamente preparados. Tiempo desde leer cada encargo hasta confirmar su guardado; exactitud de cliente/pieza. Mediana y errores para H2. No usar la pieza creada en T2 en esta medición. |
| T4. Venta del live | «Esta otra pieza se vendió en el live de prueba de hoy. Dejá registrado quién la pidió y a qué live pertenece». | Éxito sin ayuda, tiempo, asociación correcta, dudas. Usar una sexta pieza disponible y un live activo preparado. |
| T5. Pago y entrega | «Ya recibiste completo el pago de este pedido y la compradora ya lo recogió. Dejá eso registrado». | Cambios de ambos estados, errores y persistencia al recargar. Confirmación manual; no se procesa dinero. |
| T6. Cliente: live y respaldo del apartado | «Apartaste esta blusa durante el live. Entrá como cliente al live y subí el comprobante o la captura del chat que respalda que ese artículo quedó apartado para vos». | Observar si accede al live correcto, encuentra su artículo apartado y adjunta la imagen al artículo correspondiente. Registrar tiempo, dudas, ayuda, confirmación del envío y si el archivo permanece al volver a entrar. Adjuntar una imagen no confirma automáticamente el pago ni el apartado. |

**Ajuste de alcance de T6:** esta tarea se realiza con una persona del segmento comprador, identificada como C1, además de los vendedores previstos para T1–T5. Preparar una cuenta de cliente, un artículo apartado y una imagen ficticia sin datos personales. Verificar primero la disponibilidad de este recorrido; si no está implementado, registrar la tarea como no ejecutable en esa versión o evaluarla en un prototipo expresamente identificado. Este cambio documental no implementa la función. El live sigue transmitiéndose en la red social externa.

T6 sustituye la consulta de estados: **H3 conserva su definición original, pero queda fuera de la medición de este guion y requiere una prueba aparte.** T6 es exploratoria; no se ha definido un umbral cuantitativo para ella. Las referencias a H3 en este documento son antecedentes y no una medición cubierta por las seis tareas actuales.

Al terminar: «¿Qué parte te hizo dudar?», «¿Cómo lo hacés hoy?» y «¿Qué te faltaría para usarlo en una venta?». Un pedido de función nueva se registra como mejora, no como fallo automáticamente.

## Registro para las sesiones reales

Copiar esta ficha para cada participante. No completar tiempos de memoria ni convertir ejemplos en resultados.

- Participante / perfil real anonimizado: pendiente.
- Fecha, dispositivo, versión y duración: pendiente.
- Permiso para tomar notas: pendiente.
- Preparación y espera de carga, por separado: pendiente.

| Tarea / intento | Resultado: sin ayuda, con ayuda o no completó | Tiempo | Error / duda observable | Palabras textuales / ayuda dada |
|---|---|---|---|---|
| T1 | Pendiente | — | — | — |
| T2 | Pendiente | — | — | — |
| T3, intentos 1 a 5: una fila por intento | Pendiente | — | — | — |
| T4 | Pendiente | — | — | — |
| T5 | Pendiente | — | — | — |
| T6, sesión de cliente C1: live, artículo y archivo adjunto | Pendiente | — | — | — |

Para H2, guardar los cinco tiempos originales, su mediana, errores de asociación, ayuda y medición comparable del método habitual. Para T6, registrar acceso al live, artículo elegido, asociación del archivo, confirmación y persistencia. H3 requiere una prueba aparte. Si no se completa una medición, informar el dato faltante; no asignarle un tiempo inventado.

## Ejemplo simulado de registro — NO son resultados reales

Este ensayo ilustra cómo escribir notas sencillas. No describe comportamientos observados en la interfaz ni demuestra que existan los problemas sugeridos.

| Persona ficticia | Situación imaginada | Frase inventada de ejemplo | Resultado inventado |
|---|---|---|---|
| SIM-1 | Duda al buscar dónde tomar una venta directa | «¿Esto va en pedidos aunque no sea del live?» | Encuentra la opción sin ayuda después de buscar. |
| SIM-2 | Interpreta pago y entrega como un solo estado | «Ah, ya pagó, pero todavía no se la he dado». | Distingue los dos estados al revisarlos. |
| SIM-3 | Quiere registrar parte de un pago | «¿Y si solo me dio cien, dónde pongo eso?» | Pide una función de abonos; el prototipo solo maneja pago pendiente o total. |

Ejemplo numérico ficticio de H2 para SIM-1: 22, 18, 16, 24 y 20 segundos, sin errores de asociación. Ordenados: 16, 18, 20, 22 y 24; mediana: **20 segundos**. En este ejemplo no se alcanza el umbral de 15 segundos. No se midió el método habitual ni se simularon datos de H3: no se concluye una mejora de tiempo ni se cierra H3.

Si esta situación se observara realmente, correspondería revisar la solución de captura y repetir la medición. Este cálculo enseña a evaluar; no permite decidir sobre la hipótesis real.

## Hallazgos y severidad

**Hallazgos reales: pendientes de observación.** Bloqueantes y graves: cantidad desconocida, no cero confirmado. Frecuencia: sin datos; no corresponde afirmar «3 de 5».

Clasificar después de observar:

- Bloqueante: impide completar una tarea del MVP; corregir antes que lo demás.
- Grave: permite completar con mucho esfuerzo, errores o ayuda.
- Menor: duda o demora breve resuelta por la persona.
- Cosmético: detalle visual sin efecto en la tarea.
- Mejora: capacidad nueva solicitada; registrar por separado.

| ID real | Tarea y comportamiento observado | Severidad y motivo | Frecuencia n/N expuestos | Cita real anónima | Issue / verificación |
|---|---|---|---|---|---|
| Pendiente | Sin sesiones realizadas | Sin clasificar | — | — | — |

No crear issues de fallos basados únicamente en las frases de la simulación. Una solicitud real de abonos se vincularía a HU-12, ya presente en el backlog, sin duplicarla ni declararla bloqueante por ser nueva.

## Decisión sobre la hipótesis

**H2 y H3: pendientes de validación. H1 y H4: pendientes de sus experimentos correspondientes.** No se afirma que se sostengan, se ajusten o se caigan con datos inventados.

Después de las sesiones, contrastar cada métrica con su umbral original. Si el problema existe pero el flujo dificulta completar la meta, ajustar la solución; si el comportamiento esperado no aparece, revisar el rumbo con el docente. No declarar confirmación solo por opiniones positivas.

## Decisiones para las semanas 6 a 9

1. Semana 6: atender primero bloqueantes reales, luego graves; repetir las tareas afectadas en producción y registrar versión y resultado. Mantener como riesgos técnicos pendientes las verificaciones de reservas y concurrencia del backlog; no atribuirlas a usuarios sin observación.
2. Semana 7: evaluar abonos (HU-12) según solicitudes reales y reglas acordadas con tiendas.
3. Semana 8: evaluar cancelación y entrega según resultados y capacidad; conservar trazabilidad.
4. Semana 9: atender menores y cosméticos según frecuencia y prioridad, sin desplazar fallos graves.

Para cada bloqueante o grave observado, crear un issue con tarea, pasos, resultado esperado/obtenido, frecuencia, severidad, cita anónima y criterio de aceptación. Un bloqueante solo se da por resuelto tras corregirlo y verificarlo en producción. Este orden es provisional hasta contar con evidencia.
