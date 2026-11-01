# Preparación previa: del cliente al backlog

Guía de estudio antes de iniciar el reto. Las capturas indican evaluación individual de una hora, dos intentos y aprobación con 90/100. La fase evaluada debe resolverse por el estudiante conforme a sus reglas, sin asistencia de IA. Esta guía no contiene respuestas de una evaluación activa ni se debe usar para evadir sus controles.

## Antes de tocar «Iniciar»

La fase 0 verifica la entrega. Primero completar [ENTREGA_SEMANA_2.md](../ENTREGA_SEMANA_2.md). Tener a mano las dos URLs que solicita:

- Repositorio: https://github.com/TonyBSosa/Mio
- Aplicación: https://mio-web.onrender.com

No iniciar el reloj mientras las Issues, archivos, evidencia de historia y release sigan pendientes.

## Conceptos que debes poder explicar sin leer

- **Actividad:** etapa amplia del viaje, por ejemplo «dar seguimiento al pago».
- **Tarea:** acción que realiza el usuario dentro de esa actividad, por ejemplo «registrar un abono».
- **Detalle:** variante o regla, por ejemplo «rechazar un abono mayor al saldo».
- **Mapa de historias:** ordena el viaje horizontalmente y los detalles por prioridad vertical. Cada rol tiene su propio recorrido.
- **Corte horizontal:** toma lo mínimo de las actividades necesarias para que el recorrido produzca valor de principio a fin. Un catálogo muy completo sin forma de registrar la venta no completa el viaje de MIO.
- **Historia:** «Como [rol] quiero [acción] para [beneficio]». El beneficio explica por qué merece construirse.
- **INVEST:** independiente, negociable, valiosa, estimable, pequeña y comprobable. Una dependencia no se elimina ocultándola: preparar datos de prueba o dividir la historia para poder comprobarla.
- **Criterio de aceptación:** contexto, acción y resultado observable de una historia: «Dado [contexto], cuando [acción], entonces [resultado]».
- **Definición de Hecho:** condiciones comunes para todas las historias, como verificación, publicación, uso móvil y evidencia. No sustituye los criterios propios de cada historia.
- **MVP:** recorrido mínimo útil que permite aprender de un usuario real; la integridad y los permisos no son funciones opcionales.
- **Priorización:** valor y riesgo primero, considerando esfuerzo y dependencias. Una función atractiva no gana prioridad solo por ser fácil de enseñar.
- **Trazabilidad:** historia → issue → commit → despliegue → prueba → bitácora → release. «Hay código» no equivale a «funciona en producción».

## Práctica independiente de 20 minutos

Caso ficticio: una biblioteca comunitaria necesita registrar préstamos y devoluciones. No corresponde al banco de preguntas del curso.

1. En 4 minutos, identifica roles y actividades del viaje completo.
2. En 4 minutos, dibuja tareas por actividad y dos cortes horizontales.
3. En 5 minutos, escribe dos historias pequeñas con beneficio y dos criterios cada una, incluyendo un rechazo.
4. En 3 minutos, define qué significa Hecho para ambas.
5. En 4 minutos, explica por qué tu primer corte permite completar un préstamo y una devolución, y qué pospones.

Autoevaluación: ¿usaste acciones del usuario y no nombres de pantallas? ¿cada rol está representado? ¿cada criterio se comprueba observando un resultado? ¿el primer corte completa el recorrido? ¿separaste la Definición de Hecho de los criterios? ¿justificaste lo que descartas? Si alguna respuesta es no, repite antes del reto.

## Ensayo oral con MIO

Explica con tus palabras por qué HU-01 aporta valor, por qué todavía no acredita todo el MVP, cómo demostrarías un rechazo de código duplicado y qué falta para cerrarla. Después explica por qué los abonos pertenecen al segundo corte y por qué el comprador del MVP no necesita una cuenta propia. Contrasta tu explicación con el mapa y el plan, corrige y vuelve a intentarlo sin mirar.

Durante el reto administra el tiempo conforme aparezcan las fases, lee el enunciado y reserva unos minutos para revisar. No se conocen las preguntas concretas ni la distribución de puntos; no asumirla a partir de esta guía.
