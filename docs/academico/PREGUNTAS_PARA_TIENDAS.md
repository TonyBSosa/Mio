# Guía de Entrevista para Tiendas Piloto: MIO

**Proyecto:** MIO (Control de Apartados, Abonos y Entregas de Piezas Únicas)  
**Objetivo del Instrumento:** Validar las hipótesis del problema con dueños de pequeñas tiendas hondureñas que venden en redes sociales y acordar las reglas de negocio para cancelaciones, expiraciones y entregas.  
**Marco Temporal:** Semana 1 del Plan de Trabajo (8–14 de octubre de 2026)  
**Estado de este Documento:** **[PROPUESTO / PENDIENTE DE VALIDAR MEDIANTE ENTREVISTAS REALES]**  
*(Nota académica: Este cuestionario es el instrumento de recolección de datos. No se asume la existencia previa de entrevistas ni resultados hasta que el estudiante las aplique presencialmente o por videollamada).*

---

## 1. Consideraciones Éticas y Metodológicas

1. **Anonimato y Protección de Datos:** No se solicitarán nombres completos de clientes, números de cuenta bancaria personales ni contraseñas. Toda información de pedidos de ejemplo debe registrarse de forma anonimizada (ej. "Cliente A", "Prenda 01").
2. **Consentimiento Informado Verbal:** Explicar a la persona entrevistada que la información recopilada tiene exclusivamente fines académicos (proyecto de graduación) y de diseño del software piloto MIO.
3. **Duración Estimada:** 15 a 20 minutos por entrevista.
4. **Perfil de la Tienda:** Pequeño negocio hondureño (bazar, tienda de ropa de segunda mano / ropa americana o piezas únicas) que realiza ventas mediante transmisiones en vivo o publicaciones en Facebook, Instagram o TikTok.

---

## 2. Bloque 1: Contexto de Operación y Volumen de Venta

*Objetivo: Entender el flujo operativo real y la carga de trabajo en momentos pico.*

1. **¿A través de qué plataformas vende principalmente sus piezas únicas?**
   - [ ] Facebook Live
   - [ ] Instagram Live / Historias
   - [ ] TikTok Live
   - [ ] Catálogo por WhatsApp / Fotos individuales
   - [ ] Otro: _________________________

2. **¿Con qué frecuencia realiza transmisiones en vivo o dinámicas de venta por semana?**
   - [ ] 1 a 2 veces por semana
   - [ ] 3 a 5 veces por semana
   - [ ] Venta continua diaria mediante publicaciones
   - [ ] Otro: _________________________

3. **En una transmisión típica, ¿cuántas piezas únicas suele mostrar y cuántas logra apartar en promedio?**
   - Piezas mostradas por evento: aprox. ______
   - Apartados solicitados en promedio: aprox. ______

4. **¿Cuántas personas participan en la atención durante una transmisión en vivo?**
   - [ ] Solo yo (muestro las prendas y atiendo los mensajes al mismo tiempo).
   - [ ] Dos personas (una frente a cámara y otra anotando pedidos).
   - [ ] Tres o más personas.

---

## 3. Bloque 2: Identificación de Piezas y Riesgo de Duplicidad

*Objetivo: Validar el dolor de la sobreventa y la utilidad de códigos normalizados (RF-04, RF-05).*

5. **¿Cómo identifica hoy cada pieza física durante la venta?**
   - [ ] Le coloco una etiqueta física con un código manual (ej. `BLUSA-01`, número de gancho).
   - [ ] Solo por su nombre o descripción visual (ej. *"Blusa blanca floreada"*).
   - [ ] Otro método: _________________________

6. **¿Le ha ocurrido alguna vez que aparta la misma prenda física a dos personas distintas?**
   - [ ] Con frecuencia (pasa en casi todas las ventas masivas).
   - [ ] Ocasionalmente (ocurre cuando comentan muy rápido).
   - [ ] Rara vez o nunca.
   - *Detalle:* ¿Qué solución suele darle a la clienta cuando ocurre este error? _________________________

7. **¿Cuánto tiempo le toma anotar y confirmar un apartado mientras está transmitiendo en vivo?**
   - [ ] Menos de 15 segundos.
   - [ ] Entre 30 segundos y 1 minuto.
   - [ ] Más de 1 minuto (anoto al finalizar la transmisión revisando la repetición del video).

---

## 4. Bloque 3: Consolidación de Pedidos por Cliente

*Objetivo: Diseñar la estructura del consolidado de cliente (RF-16, RF-17).*

8. **¿Es común que una misma clienta aparte varias piezas en el mismo live o a lo largo de varios días antes de pedir su envío?**
   - [ ] Sí, es la regla general (suelen acumular varias piezas para justificar un solo envío).
   - [ ] No, casi siempre apartan una sola pieza y piden despacho inmediato.
   - [ ] Variable según la clienta.

9. **¿Cómo lleva actualmente el control de las piezas acumuladas por cada clienta?**
   - [ ] Libreta de apuntes en papel.
   - [ ] Notas en el teléfono celular o mensajes guardados en WhatsApp.
   - [ ] Hoja de cálculo (Excel / Google Sheets).
   - [ ] En la memoria o bolsas físicas etiquetadas con el nombre de la clienta.

---

## 5. Bloque 4: Manejo de Abonos Parciales y Control de Saldos

*Objetivo: Definir las reglas técnicas para el registro de abonos (RF-18, RF-19, RF-20).*

10. **¿Permite que sus clientes aparten piezas entregando un pago parcial (abono)?**
    - [ ] Sí, exigimos un monto mínimo o porcentaje para asegurar el apartado.
    - [ ] Sí, el cliente abona lo que pueda en ese momento.
    - [ ] No, el apartado requiere el pago completo inmediato (si responde esto, pasar a la pregunta 13).

11. **¿Qué medios de pago utiliza para recibir los abonos en Honduras?**
    - [ ] Transferencia bancaria local (BAC Credomatic, Banco Atlántida, Ficohsa, Banpaís, etc.).
    - [ ] Billeteras electrónicas móviles (Tengo, Dilo, etc.).
    - [ ] Pago en efectivo contra entrega o en local físico.
    - [ ] Otro: _________________________

12. **¿Cómo calcula y comunica el saldo pendiente de una clienta que ya dio uno o más abonos?**
    - [ ] Lo calculo mentalmente o con calculadora y se lo escribo por mensaje privado.
    - [ ] Llevo una cuenta detallada en libreta o Excel.
    - [ ] Ha habido ocasiones de confusión o desacuerdo sobre cuánto dinero restaba pagar.

---

## 6. Bloque 5: Políticas de Cancelación y Dinero Recibido

*Objetivo: Resolver la regla técnica pendiente para el módulo de cancelaciones (RF-23, CU-05) **[PENDIENTE DE VALIDAR]**.*

13. **¿Cuál es el plazo límite de tiempo que le otorga a un comprador para pagar o abonar su apartado antes de cancelarlo?**
    - [ ] 24 horas.
    - [ ] 48 horas.
    - [ ] Hasta el próximo live o fin de semana.
    - [ ] Plazo personalizado por clienta.

14. **Situación crítica: Si una clienta apartó una prenda de L 500.00, dio un abono de L 200.00 y luego de varios días dice que ya no la quiere o no vuelve a contestar, ¿qué hace usted con ese dinero recibido?**
    - [ ] **Opción A (Devolución):** Le devuelvo los L 200.00 por transferencia bancaria y libero la prenda.
    - [ ] **Opción B (Saldo a favor / Crédito en tienda):** No le devuelvo el dinero en efectivo, pero le guardo esos L 200.00 como saldo a favor para que los gaste en otra prenda futura.
    - [ ] **Opción C (Penalización / No reembolsable):** La clienta pierde el abono como costo por haber retenido la prenda sin venderla, y la prenda se vuelve a poner en venta.
    - [ ] **Opción D (Regla combinada o condicionada):** ____________________________________________________  
    *(Nota para el sistema MIO: La opción mayoritaria definirá el flujo predeterminado en el software).*

15. **Al cancelar el apartado, ¿la prenda debe volver inmediatamente al catálogo de venta disponible o requiere un paso de revisión física previa?**
    - [ ] Debe volver de inmediato a estar disponible para la venta.
    - [ ] Prefiero revisarla físicamente antes de reactivarla en el sistema.

---

## 7. Bloque 6: Despacho y Entrega de Pedidos

*Objetivo: Acordar las condiciones para autorizar la entrega (RF-25, RF-26, CU-06) **[PENDIENTE DE VALIDAR]**.*

16. **¿Entrega o despacha alguna vez una prenda si todavía tiene un saldo pendiente de pago?**
    - [ ] Jamás. Toda prenda debe tener saldo L 0.00 antes de salir de la tienda.
    - [ ] Sí, únicamente cuando el envío es con pago contra entrega en efectivo (el mensajero cobra el saldo al entregar).
    - [ ] Sí, con clientas de extrema confianza a quienes les otorgo crédito personal.

17. **¿Qué métodos de entrega utiliza habitualmente?**
    - [ ] Retiro en local físico o domicilio de la tienda.
    - [ ] Punto de encuentro público acordado en la ciudad.
    - [ ] Servicio de mensajería local en motocicleta.
    - [ ] Empresas de paquetería nacional (Cargo Expreso, Servientrega, etc.).

---

## 8. Bloque 7: Disposición hacia la Prueba Piloto de MIO

*Objetivo: Validar la disposición a probar la aplicación en la Semana 7 sin asumir éxito comercial.*

18. **Si le facilitamos una herramienta web sencilla donde pueda registrar las prendas por código, apartado en un clic, saldos automáticos y lista de entregas, ¿estaría dispuesta(o) a utilizarla en una transmisión real durante 1 a 2 semanas?**
    - [ ] Sí, con gusto.
    - [ ] Tal vez, dependiendo de qué tan rápido sea usarla en vivo.
    - [ ] No tengo disponibilidad en este momento.

19. **¿Qué característica considera que sería lo más indispensable para que la herramienta realmente le ahorre tiempo y dolores de cabeza?**
    - Respuesta libre: __________________________________________________________________

---

## 9. Ficha de Registro de la Entrevista (Plantilla para el Estudiante)

*(El estudiante debe completar una copia de esta ficha por cada tienda entrevistada durante la Semana 1).*

- **Identificador de Tienda (Anónimo):** Tienda A / Tienda B
- **Ubicación:** Ciudad (ej. Tegucigalpa / San Pedro Sula / otra)
- **Fecha de Realización:** ____ / Octubre / 2026
- **Medio de Entrevista:** Presencial / Llamada telefónica / Videollamada
- **Síntesis de Hallazgos Clave:**
  - Plazo acordado de expiración de apartados: ________ horas.
  - Destino del dinero en cancelaciones con abonos: [Devolución / Saldo a favor / Penalización].
  - Condición de entrega: [Saldo cero estricto / Admite cobro contra entrega].
  - Validación del problema de duplicidad: [Alta / Media / Baja frecuencia].
- **Firma o Registro del Estudiante:** __________________________________
