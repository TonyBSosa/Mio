# Casos de Uso del Sistema: MIO

**Proyecto:** MIO (Control de Apartados, Abonos y Entregas de Piezas Únicas)  
**Entorno:** Angular (Frontend), Express / Node.js (Backend), MongoDB / Mongoose  
**Marco Temporal:** Plan de 8 Semanas  
**Fecha:** Octubre de 2026  

---

## Convenciones y Clasificación de Estado

Cada caso de uso o paso operativo indica claramente su situación respecto a la base de código actual:
- **[IMPLEMENTADO]**: La funcionalidad existe y opera en el código actual (se cita el archivo y líneas).
- **[PROPUESTO]**: Funcionalidad planificada para ser desarrollada en las semanas subsiguientes del cronograma.
- **[PENDIENTE DE VALIDAR]**: Regla operativa dependiente del acuerdo con las tiendas en la entrevista piloto.

---

## CU-01: Alta de Pieza Única

- **Actores:** Vendedor / Encargado de Tienda.
- **Propósito:** Registrar en el catálogo una prenda o pieza única con su identificación, precio y características antes o durante la venta.
- **Precondiciones:**
  - El usuario debe haber iniciado sesión con rol `vendedor` y disponer de un token JWT válido.
- **Estado de Implementación:** **[IMPLEMENTADO PARCIALMENTE]**  
  *Backend:* [`backend/src/models/productos.js`](file:///d:/VANGUARDIA/MIO/backend/src/models/productos.js), [`backend/src/services/productoService.js#L58-L84`](file:///d:/VANGUARDIA/MIO/backend/src/services/productoService.js#L58-L84).  
  *Frontend:* [`frontend/src/app/pages/productos/productos.ts`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/productos/productos.ts), [`frontend/src/app/pages/productos/productos.html`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/productos/productos.html).

### Flujo Principal
1. El vendedor accede al módulo de productos.
2. El sistema muestra el formulario de registro y la lista de piezas existentes.
3. El vendedor ingresa:
   - Nombre de la pieza (obligatorio).
   - Código alfanumérico (opcional; si se omite, el sistema genera automáticamente un prefijo `P-` con 12 caracteres hexadecimales).
   - Precio en Lempiras (obligatorio, número $\ge 0$).
   - Descripción, categoría y URL de fotografía (opcionales).
4. El vendedor presiona "Crear Producto" / "Guardar".
5. El frontend envía una petición `POST /api/productos` con los datos y el encabezado `Authorization: Bearer <token>`.
6. El backend normaliza el código a mayúsculas, verifica que no exista colisión en la misma tienda y guarda la pieza en estado `"activo"`.
7. El sistema responde con HTTP 201 y el objeto de la pieza creada.
8. La interfaz actualiza la lista de inventario y muestra un mensaje de confirmación.

### Flujos Alternativos y Errores
- **E1. Código duplicado en la misma tienda [IMPLEMENTADO]:**
  - Si el código ya existe para ese `vendedorId`, el índice único de MongoDB arroja error E11000. El servicio captura la excepción y responde HTTP 409: `"Ya existe un producto con ese codigo en tu tienda"` ([`backend/src/services/productoService.js#L35-L37`](file:///d:/VANGUARDIA/MIO/backend/src/services/productoService.js#L35-L37)). La interfaz muestra el error sin perder los datos capturados.
- **E2. Formato de código inválido [IMPLEMENTADO]:**
  - Si el código contiene caracteres no permitidos (solo se aceptan letras, números, guiones y guiones bajos, longitud 1–30), el backend responde HTTP 400: `"El codigo debe tener entre 1 y 30 letras, numeros, guiones o guiones bajos"` ([`backend/src/services/productoService.js#L26`](file:///d:/VANGUARDIA/MIO/backend/src/services/productoService.js#L26)).
- **E3. Precio o nombre faltante [IMPLEMENTADO]:**
  - Si no se suministra nombre o el precio es menor que 0, responde HTTP 400.

### Postcondiciones
- La pieza queda guardada en MongoDB con estado `"activo"` y código único asignado para esa tienda.

### Limitaciones Actuales del Código
- El modelo actual solo contempla los estados `"activo"`, `"inactivo"` y `"apartado"`. No existe aún `"vendido"` o `"entregado"` en el esquema de productos.

---

## CU-02: Apartado de Pieza

- **Actores:** Vendedor / Encargado de Tienda.
- **Propósito:** Asignar una pieza física exclusiva a un cliente específico tan pronto como este comente o solicite el apartado en redes sociales.
- **Precondiciones:**
  - El usuario debe estar autenticado como vendedor.
  - La pieza debe existir y estar en estado disponible/activo.
  - El cliente debe existir o registrarse en ese instante.
- **Estado de Implementación:** **[PROPUESTO / IMPLEMENTADO CON DEFICIENCIAS CRÍTICAS]**  
  *Código existente:* [`frontend/src/app/pages/live-activo/live-activo.ts#L273-L324`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/live-activo/live-activo.ts#L273-L324), [`backend/src/services/pedidoService.js#L87-L140`](file:///d:/VANGUARDIA/MIO/backend/src/services/pedidoService.js#L87-L140).

### Flujo Principal (Propuesto para Semana 2)
1. Durante una transmisión en vivo o atención diaria, un cliente solicita apartar una pieza (ej. código `BLUSA-01`).
2. El vendedor busca la pieza por su código o nombre.
3. El vendedor selecciona al cliente existente o usa el formulario rápido ("Cliente Rápido") ingresando nombre y teléfono.
4. El sistema autocompleta el precio registrado de la pieza y asigna cantidad 1 de forma estricta.
5. El vendedor presiona "Confirmar Apartado".
6. El frontend envía una única petición atómica `POST /api/pedidos` enviando `{ clienteId, productoId, observaciones }`.
7. El backend ejecuta una operación de reserva atómica sobre la pieza:
   - Verifica en una sola instrucción condicional que la pieza pertenezca al vendedor y su estado sea `"activo"` o `"disponible"`.
   - Modifica el estado de la pieza a `"apartado"`.
   - Crea el documento de pedido vinculando el `productoId`, el `precio` capturado en ese instante y el `clienteId`.
8. El backend responde HTTP 201 con el pedido generado.
9. La pieza deja de mostrarse en la lista de disponibles y pasa al consolidado del cliente.

### Flujos Alternativos y Errores
- **E1. Pieza ya apartada por otro comprador (Concurrencia) [PROPUESTO]:**
  - Si la pieza fue apartada milisegundos antes por otra persona o solicitud simultánea, la actualización atómica condicional devuelve 0 documentos modificados. El backend responde HTTP 409: `"La pieza ya ha sido apartada"`. El sistema no crea el pedido.
- **E2. Cliente inexistente o inválido [IMPLEMENTADO]:**
  - Si el `clienteId` no es un ObjectId válido o no pertenece a la tienda autenticada, responde HTTP 404: `"Cliente no encontrado"` ([`backend/src/services/pedidoService.js#L70`](file:///d:/VANGUARDIA/MIO/backend/src/services/pedidoService.js#L70)).
- **E3. Live inexistente o inactivo [IMPLEMENTADO EN CÓDIGO ACTUAL / A REVISAR]:**
  - En el código actual, el servicio arroja HTTP 400: `"Solo se pueden registrar pedidos en un Live activo."` ([`backend/src/services/pedidoService.js#L83`](file:///d:/VANGUARDIA/MIO/backend/src/services/pedidoService.js#L83)). En la propuesta de la Semana 2 se eliminará esta restricción obligatoria para permitir apartados fuera de un evento live.

### Postcondiciones
- La pieza queda en estado `"apartado"`.
- Se genera un registro de pedido con saldo igual al precio total de la pieza.

### Limitaciones Actuales del Código
- **Sin referencia de ID:** [`backend/src/models/pedidos.js#L23-L27`](file:///d:/VANGUARDIA/MIO/backend/src/models/pedidos.js#L23-L27) almacena el nombre de la pieza como cadena de texto plano (`producto: String`), perdiendo el vínculo relacional con el documento de la pieza.
- **Sin reserva atómica:** En [`frontend/src/app/pages/live-activo/live-activo.ts#L285-L323`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/live-activo/live-activo.ts#L285-L323), la reserva se realiza en dos peticiones HTTP independientes: primero `crearPedido` y luego en el callback `cambiarEstado('apartado')`. Si la segunda falla, el pedido existe pero la pieza sigue libre. Además, en [`frontend/src/app/pages/pedidos/pedidos.ts`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/pedidos/pedidos.ts) ni siquiera se invoca el cambio de estado de la pieza.

---

## CU-03: Consolidación por Cliente

- **Actores:** Vendedor / Encargado de Tienda.
- **Propósito:** Visualizar en un único paquete acumulado todas las piezas apartadas por un mismo cliente en distintos lives o fechas, facilitando la preparación del pedido y el cobro global.
- **Precondiciones:**
  - Vendedor autenticado.
  - Existen pedidos y apartados registrados previamente para el cliente.
- **Estado de Implementación:** **[PROPUESTO]**  
  *Código existente:* Filtrado básico en memoria en el cliente web ([`frontend/src/app/pages/pedidos/pedidos.ts#L366-L380`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/pedidos/pedidos.ts#L366-L380)). No existe endpoint de agregación en backend.

### Flujo Principal (Propuesto para Semana 3)
1. El vendedor accede al módulo "Consolidación de Clientes" o selecciona un cliente en la pantalla de pedidos.
2. El sistema solicita al backend los pedidos activos del cliente (`GET /api/clientes/:id/consolidado`).
3. El backend realiza una agregación en MongoDB uniendo los pedidos no entregados ni cancelados del cliente, extrayendo las piezas, sus precios históricos y los abonos vinculados.
4. La pantalla presenta:
   - Lista detallada de piezas apartadas (código, nombre, precio, fecha de apartado).
   - Monto total acumulado de las prendas: $\sum \text{Precio}$.
   - Monto total abonado a la fecha: $\sum \text{Abonos}$.
   - Saldo pendiente por liquidar.
   - Estado general del paquete (ej. "En apartado", "Listo para entrega", "Entregado").
5. El vendedor puede agregar notas de entrega o compartir un resumen de texto con el cliente vía WhatsApp.

### Flujos Alternativos y Errores
- **E1. Cliente sin pedidos activos:**
  - El sistema muestra el estado de cuenta en cero con mensaje: `"El cliente no tiene piezas apartadas pendientes."`
- **E2. Cliente de otra tienda:**
  - Si el vendedor intenta consultar el ID de un cliente que no le pertenece, el backend retorna HTTP 404.

### Postcondiciones
- El vendedor obtiene la visión integral del paquete del cliente sin necesidad de sumar manualmente piezas en chats o libretas.

---

## CU-04: Registro de Abono

- **Actores:** Vendedor / Encargado de Tienda.
- **Propósito:** Registrar un pago parcial o total recibido (vía transferencia bancaria, billetera móvil o efectivo) asociado a un pedido o paquete consolidado de un cliente.
- **Precondiciones:**
  - Vendedor autenticado.
  - El pedido o paquete debe tener saldo pendiente mayor a cero.
  - El vendedor verificó previamente en su aplicación bancaria o en efectivo que los fondos fueron recibidos.
- **Estado de Implementación:** **[PROPUESTO]**  
  *Limitación actual:* El sistema solo ofrece un interruptor binario `estadoPago: ["pendiente", "pagado"]` mediante `PATCH /api/pedidos/:id/pago` ([`backend/src/services/pedidoService.js#L227-L247`](file:///d:/VANGUARDIA/MIO/backend/src/services/pedidoService.js#L227-L247)). No existe soporte para abonos parciales, montos ni historial.

### Flujo Principal (Propuesto para Semana 4)
1. El vendedor localiza el pedido o paquete del cliente.
2. Presiona la opción "Registrar Abono".
3. El sistema muestra modal con:
   - Saldo actual pendiente.
   - Campo para monto del abono (Lempiras).
   - Método de pago (Transferencia Atlántida, BAC, Ficohsa, Billetera Tengo, Efectivo, etc.).
   - Número o referencia del comprobante bancario.
   - Fecha del abono (por defecto la fecha actual).
   - Notas u observaciones.
4. El vendedor completa los campos y confirma la operación.
5. El frontend envía `POST /api/pedidos/:id/abonos` o `POST /api/clientes/:clienteId/abonos`.
6. El backend valida:
   - Monto $> 0$.
   - Monto $\le$ Saldo pendiente actual.
7. El backend registra el abono de forma persistente e inmutable en el historial y recalcula el saldo.
8. Si el nuevo saldo es L 0.00, el estado de pago del pedido se actualiza automáticamente a `"pagado"`. Si el saldo es $> 0$, se mantiene en `"abonado_parcial"`.
9. El backend responde HTTP 201 con el abono registrado y el saldo actualizado.
10. La interfaz refresca el balance y muestra el nuevo saldo.

### Flujos Alternativos y Errores
- **E1. Monto excede el saldo pendiente [PROPUESTO]:**
  - Si el saldo es L 300 y se intenta ingresar un abono de L 500, el backend rechaza la petición con HTTP 400: `"El monto del abono no puede exceder el saldo pendiente (L 300.00)"`.
- **E2. Monto menor o igual a cero [PROPUESTO]:**
  - El backend responde HTTP 400: `"El monto del abono debe ser un valor positivo"`.
- **E3. Pedido ya pagado totalmente [PROPUESTO]:**
  - Si el saldo ya es L 0.00, el sistema deshabilita el registro de nuevos abonos.

### Postcondiciones
- Se añade un registro inmutable al historial de abonos.
- El saldo del cliente/pedido se reduce exactamente por el monto ingresado.

---

## CU-05: Cancelación de Apartado y Liberación de Pieza

- **Actores:** Vendedor / Encargado de Tienda.
- **Propósito:** Desactivar un apartado cuando el cliente desiste de la compra o expira el plazo límite, liberando la prenda física al inventario y resolviendo el destino del dinero abonado.
- **Precondiciones:**
  - Vendedor autenticado.
  - El pedido debe estar en estado activo o apartado (no cancelado previamente ni entregado).
- **Estado de Implementación:** **[PROPUESTO / DISCREPANCIA EN CÓDIGO ACTUAL]**  
  *Código existente:* [`backend/src/services/pedidoService.js#L271-L283`](file:///d:/VANGUARDIA/MIO/backend/src/services/pedidoService.js#L271-L283) solo implementa borrado físico duro (`eliminarPedido`), el cual destruye el pedido sin liberar el producto ni registrar trazabilidad contable.

### Flujo Principal (Propuesto para Semana 5)
1. El vendedor selecciona el pedido que desea cancelar.
2. Presiona "Cancelar Apartado".
3. El sistema evalúa si el pedido registra dinero abonado:
   - **Caso A: Sin dinero abonado ($\text{Abonos} = 0$):**  
     El vendedor selecciona el motivo de cancelación (ej. "Cliente desistió", "Plazo de apartado expirado", "Error de captura").
   - **Caso B: Con dinero previamente abonado ($\text{Abonos} > 0$) [PENDIENTE DE VALIDAR]:**  
     El sistema exige indicar el tratamiento acordado para el dinero recibido:
     1. *Devolución monetaria:* Registrar comprobante de devolución al cliente.
     2. *Saldo a favor:* Asignar el importe como saldo acreedor en la ficha del cliente para futuras compras.
     3. *Retención por política / no reembolsable:* Registrar como penalización según las reglas comerciales de la tienda.
4. El vendedor confirma la cancelación.
5. El frontend envía `POST /api/pedidos/:id/cancelar` con el motivo y la resolución del abono.
6. El backend:
   - Marca el pedido con `estado: "cancelado"`.
   - Modifica el estado de la pieza física asociada a `"activo"` / `"disponible"`.
   - Registra en el log de auditoría la fecha, usuario y destino del dinero.
7. El backend responde HTTP 200 con el resultado.
8. La pieza vuelve a mostrarse disponible en el catálogo general.

### Flujos Alternativos y Errores
- **E1. Intento de cancelar un pedido ya entregado [PROPUESTO]:**
  - Si el pedido tiene `estadoEntrega: "entregado"`, el backend rechaza la cancelación con HTTP 400: `"No se puede cancelar un pedido que ya ha sido entregado al cliente"`.
- **E2. Cancelación con abono sin destino especificado [PROPUESTO]:**
  - Si existen abonos y no se envía la resolución financiera, responde HTTP 400: `"Debe especificar el destino del dinero abonado previo a la cancelacion"`.

### Postcondiciones
- La pieza queda liberada e identificable en inventario.
- El pedido no se borra de la base de datos; conserva su trazabilidad como cancelado.

---

## CU-06: Entrega de Pedido

- **Actores:** Vendedor / Encargado de Tienda.
- **Propósito:** Registrar formalmente la entrega o despacho físico de la prenda al comprador.
- **Precondiciones:**
  - Vendedor autenticado.
  - El pedido no debe estar cancelado ni haber sido entregado previamente.
- **Estado de Implementación:** **[IMPLEMENTADO PARCIALMENTE / PROPUESTO]**  
  *Código actual:* [`backend/src/routes/pedidoRoutes.js#L25`](file:///d:/VANGUARDIA/MIO/backend/src/routes/pedidoRoutes.js#L25) expone `PATCH /api/pedidos/:id/entrega` cambiando el estado a `"entregado"` sin verificar saldos ni registrar fecha.

### Flujo Principal (Propuesto para Semana 5)
1. El comprador se presenta a retirar las prendas o la tienda prepara el paquete de envío por mensajería.
2. El vendedor accede al pedido o consolidado del cliente y presiona "Marcar como Entregado".
3. El sistema valida el saldo pendiente:
   - Si $\text{Saldo} = 0$, el sistema procede inmediatamente.
   - Si $\text{Saldo} > 0$ **[PENDIENTE DE VALIDAR]**, el sistema muestra advertencia: `"El pedido tiene un saldo pendiente de L [Monto]. ¿Desea registrar el cobro en efectivo restante o autorizar excepción?"`.
4. El vendedor confirma la entrega (opcionalmente ingresa método: "Punto de encuentro", "Envíos Cargo Expreso", etc.).
5. El frontend envía la solicitud al backend.
6. El backend asigna `estadoEntrega: "entregado"`, registra `fechaEntrega: new Date()` y actualiza el estado de las piezas a `"vendido"` o `"entregado"`.
7. El backend responde HTTP 200.
8. La interfaz actualiza el estado a "Entregado" y archiva el pedido de la bandeja de pendientes.

### Flujos Alternativos y Errores
- **E1. Intento de entregar pedido cancelado [PROPUESTO]:**
  - Responde HTTP 400: `"No se puede entregar un pedido cancelado"`.
- **E2. Bloqueo por saldo pendiente [PENDIENTE DE VALIDAR]:**
  - Si la política acordada con la tienda prohíbe entregar con saldo, el sistema bloquea el botón y exige liquidar el saldo mediante el CU-04 primero.

### Postcondiciones
- El pedido queda marcado como entregado con marca temporal.
- La prenda física queda cerrada en el ciclo de inventario.

---

## CU-07: Consulta de Saldo y Estado de Cuenta

- **Actores:** Vendedor / (Opcional: Cliente si se habilita portal de consulta).
- **Propósito:** Consultar de forma instantánea el balance financiero de una transacción o comprador sin inconsistencias ni cálculos manuales.
- **Precondiciones:**
  - Vendedor autenticado.
- **Estado de Implementación:** **[PROPUESTO]**  
  *Código actual:* Solo existe resumen por Live en [`backend/src/services/resumenService.js`](file:///d:/VANGUARDIA/MIO/backend/src/services/resumenService.js), el cual suma precios completos según el booleano `estadoPago === "pagado"`.

### Flujo Principal (Propuesto para Semana 4)
1. El vendedor accede al perfil del cliente o a la consulta rápida por código de pedido.
2. El sistema recupera el registro y computa:
   $$\text{Monto Acordado} = \sum \text{Precio de Piezas}$$
   $$\text{Total Recibido} = \sum \text{Abonos Registrados}$$
   $$\text{Saldo Deudor} = \text{Monto Acordado} - \text{Total Recibido}$$
3. El sistema despliega el desglose detallado con cada abono (fecha, método, referencia) y el saldo pendiente restante.
4. El vendedor puede generar un formato de texto plano listo para enviar por WhatsApp:  
   *«Hola [Cliente], confirmamos tu abono de L 200.00. Tu nuevo saldo pendiente por la pieza [Código] es de L 300.00. ¡Gracias por tu compra!»*

### Flujos Alternativos y Errores
- **E1. Identificador de cliente no encontrado:**
  - El sistema muestra HTTP 404: `"Cliente no encontrado"`.

### Postcondiciones
- Transparencia contable verificable tanto para la tienda como para el comprador.
