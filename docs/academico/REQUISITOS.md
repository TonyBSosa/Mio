# Especificación de Requisitos de Software: MIO

**Proyecto:** MIO (Plataforma de Control de Apartados, Abonos y Entregas de Piezas Únicas)  
**Entorno Tecnológico:** Angular 21 (Frontend), Express 5 / Node.js (Backend), MongoDB (versión del servidor pendiente de verificar) / Mongoose 9 (ODM)  
**Marco Temporal:** Piloto y proyecto de graduación de 8 semanas  
**Fecha de Elaboración:** Octubre de 2026  
**Clasificación de Estados en este Documento:**
- **[IMPLEMENTADO]**: Existe en el código fuente actual (se referencia archivo y línea exacta).
- **[PROPUESTO]**: Especificado para su desarrollo según el plan de 8 semanas.
- **[PENDIENTE DE VALIDAR]**: Requiere acuerdo con la tienda en entrevista o confirmación de rúbrica universitaria.

---

## 1. Introducción y Definición del Problema

### 1.1 Contexto
Pequeños emprendimientos en Honduras (especialmente bazares y tiendas de ropa de segunda mano o piezas únicas) comercializan su inventario mediante transmisiones en vivo (*lives*) o publicaciones en redes sociales (Facebook, Instagram y TikTok). En estas transmisiones, las prendas son exclusivas (una sola unidad física por modelo/talla). Los compradores comentan palabras clave (como *"mío"*, *"lo quiero"*, o el código de la prenda) para solicitar el apartado.

### 1.2 El Problema
1. **Riesgo de sobreventa y duplicidad:** Al recibir decenas de comentarios y mensajes directos simultáneos, el vendedor anota manualmente en libretas o notas del teléfono, apartando ocasionalmente la misma pieza física a dos personas distintas.
2. **Desconexión entre apartados y piezas:** El sistema actual registra nombres en texto plano y no un identificador único enlazado al inventario, lo que impide asegurar reservas atómicas.
3. **Consolidación caótica:** Un mismo comprador suele apartar varias piezas a lo largo de una o varias transmisiones durante la semana. La tienda carece de una vista consolidada que agrupe sus compras en un solo paquete o pedido maestro.
4. **Descontrol financiero en abonos parciales:** Las tiendas aceptan apartados con pagos parciales (abonos vía transferencias bancarias o billeteras electrónicas locales), pero llevan el saldo en mensajes de chat dispersos. No existe un saldo dinámico ni un historial trazable de comprobantes.
5. **Incertidumbre en cancelaciones y entregas:** Si un comprador desiste tras dar un abono o desaparece después del plazo límite, la tienda no tiene una regla estandarizada para liberar la prenda y definir el destino contable del dinero previamente recibido.
6. **Limitación de recursos del proyecto:** El estudiante cuenta con una disponibilidad semanal reducida (~2 horas semanales) y desarrollo asistido por IA. El sistema debe priorizar solidez en reservas y dinero antes que complejidad cosmética.

### 1.3 Alcance del Proyecto (8 Semanas)

#### Dentro del Alcance (Compromiso del Piloto)
- Gestión de catálogo de piezas únicas con código alfanumérico normalizado e índice único por tienda.
- Registro rápido de apartados durante eventos en vivo o venta diaria.
- Consolidación de pedidos y prendas por cliente.
- Registro manual de abonos (monto, fecha, método de pago, referencia de comprobante) con cálculo de saldo pendiente.
- Flujo de cancelación con liberación de inventario y tratamiento explícito del dinero abonado.
- Control de entrega de pedidos (bloqueo por saldo pendiente o excepción autorizada).
- Aislamiento estricto de datos entre tiendas (`vendedorId` obligatorio en toda consulta).
- Resúmenes operativos (reservado, cobrado, pendiente) y exportación de datos a CSV.

#### Fuera del Alcance (Exclusiones Explícitas)
- **No aloja video ni streaming:** MIO no transmite video ni consume ancho de banda de medios. Los lives se realizan en redes sociales externas; el sistema solo registra enlaces informativos.
- **No es un Marketplace:** No existe vitrina global compartida, sistema de seguidores, muro social ni recomendaciones algorítmicas entre tiendas.
- **Sin captura automática de comentarios:** No se conecta a APIs de Facebook/Instagram/TikTok para leer comentarios en tiempo real (prohibido por complejidad, cuotas y fragilidad de APIs). La captura es realizada por el operador de la tienda.
- **Sin pasarelas de pago automatizadas:** No se procesan tarjetas de crédito ni liquidaciones bancarias directas. Los abonos son confirmaciones manuales de comprobantes recibidos.
- **Sin facturación electrónica tributaria ni membresías vitalicias:** Se limita a comprobantes internos de apartado.

---

## 2. Actores del Sistema

| Actor | Descripción | Rol en Sistema / Código |
|---|---|---|
| **Vendedor / Tienda** | Dueño o encargado de la pequeña tienda. Registra piezas, apartados en vivo, abonos recibidos, cancela y entrega pedidos. | `rol: "vendedor"` en [`backend/src/models/users.js`](file:///d:/VANGUARDIA/MIO/backend/src/models/users.js#L27). [IMPLEMENTADO] |
| **Cliente / Comprador** | Comprador final que aparta prendas en redes. Registrado por la tienda mediante nombre, teléfono y dirección. | Colección `clientes` en [`backend/src/models/clientes.js`](file:///d:/VANGUARDIA/MIO/backend/src/models/clientes.js). [IMPLEMENTADO] |
| **Administrador** | Administrador de la plataforma para supervisión técnica básica. | `rol: "admin"` en [`backend/src/models/users.js`](file:///d:/VANGUARDIA/MIO/backend/src/models/users.js#L27). [IMPLEMENTADO] |

---

## 3. Requisitos Funcionales (RF)

### Módulo 1: Seguridad y Aislamiento de Tienda

- **RF-01: Autenticación de Usuarios [IMPLEMENTADO]**  
  El sistema debe permitir a los vendedores iniciar sesión mediante correo y contraseña con tokens JWT.  
  *Referencia:* [`backend/src/controllers/authController.js`](file:///d:/VANGUARDIA/MIO/backend/src/controllers/authController.js), [`backend/src/middlewares/authMiddleware.js`](file:///d:/VANGUARDIA/MIO/backend/src/middlewares/authMiddleware.js).

- **RF-02: Aislamiento Multitienda (Multi-tenancy Lógico) [IMPLEMENTADO]**  
  Todas las entidades (productos, clientes, pedidos, lives) deben pertenecer a un `vendedorId`. Ningún vendedor puede ver, consultar, editar o eliminar registros de otra tienda ni por interfaz ni por llamadas directas al API.  
  *Referencia:* Verificado en filtros de [`backend/src/repositories/productoRepository.js`](file:///d:/VANGUARDIA/MIO/backend/src/repositories/productoRepository.js) y [`backend/src/repositories/pedidoRepository.js`](file:///d:/VANGUARDIA/MIO/backend/src/repositories/pedidoRepository.js).

- **RF-03: Control de Acceso por Roles [IMPLEMENTADO]**  
  El sistema debe restringir rutas administrativas y comerciales según el rol (`vendedor`, `admin`).  
  *Referencia:* [`backend/src/middlewares/roleMiddleware.js`](file:///d:/VANGUARDIA/MIO/backend/src/middlewares/roleMiddleware.js).

---

### Módulo 2: Catálogo de Piezas Únicas

- **RF-04: Código Identificador de Pieza [IMPLEMENTADO]**  
  Cada pieza debe admitir un código alfanumérico (1–30 caracteres, mayúsculas, números, guiones o guiones bajos). Si no se ingresa, el sistema generará uno aleatorio con prefijo `P-`.  
  *Referencia:* [`backend/src/services/productoService.js#L21-L29`](file:///d:/VANGUARDIA/MIO/backend/src/services/productoService.js#L21-L29) y [`backend/src/models/productos.js#L57-L60`](file:///d:/VANGUARDIA/MIO/backend/src/models/productos.js#L57-L60).

- **RF-05: Unicidad de Código por Tienda [IMPLEMENTADO]**  
  El código de producto no debe duplicarse dentro de la misma tienda (índice único compuesto `{ vendedorId: 1, codigo: 1 }`). Debe permitirse que dos tiendas distintas usen el mismo código.  
  *Referencia:* [`backend/src/models/productos.js#L57-L60`](file:///d:/VANGUARDIA/MIO/backend/src/models/productos.js#L57-L60); respuesta HTTP 409 en [`backend/src/services/productoService.js#L35-L37`](file:///d:/VANGUARDIA/MIO/backend/src/services/productoService.js#L35-L37).

- **RF-06: Estados de la Pieza Única [IMPLEMENTADO PARCIALMENTE / PROPUESTO]**  
  - *Estado actual:* El modelo solo contempla `["activo", "inactivo", "apartado"]` ([`backend/src/models/productos.js#L47`](file:///d:/VANGUARDIA/MIO/backend/src/models/productos.js#L47)).  
  - *Propuesto para Semana 2 y 5:* Ampliar ciclo de vida a `["disponible", "apartado", "vendido", "entregado", "inactivo"]` para distinguir piezas pagadas y entregadas de piezas apartadas temporalmente.

- **RF-07: Búsqueda y Filtrado de Piezas [IMPLEMENTADO]**  
  La tienda debe poder buscar piezas por código, nombre o categoría para agilizar la selección en vivo.  
  *Referencia:* [`frontend/src/app/pages/productos/productos.ts`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/productos/productos.ts).

---

### Módulo 3: Clientes y Directorio de Contacto

- **RF-08: Registro de Compradores [IMPLEMENTADO]**  
  La tienda puede crear compradores con nombre obligatorio, teléfono y dirección.  
  *Referencia:* [`backend/src/models/clientes.js`](file:///d:/VANGUARDIA/MIO/backend/src/models/clientes.js) y [`frontend/src/app/pages/clientes/clientes.ts`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/clientes/clientes.ts).

- **RF-09: Alta Rápida de Comprador durante el Live [IMPLEMENTADO]**  
  La pantalla de Live debe permitir ingresar un comprador al vuelo sin abandonar el flujo de captura de pedidos.  
  *Referencia:* [`frontend/src/app/pages/live-activo/live-activo.ts#L248-L270`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/live-activo/live-activo.ts#L248-L270).

- **RF-10: Identificador de Red Social del Comprador [PROPUESTO]**  
  Agregar campo opcional `usuarioRedSocial` (ej. `@maria_hn`) al cliente para facilitar ubicar quién comentó en la transmisión.

---

### Módulo 4: Apartado y Pedidos

- **RF-11: Vinculación de Pedido por Referencia a Producto (`productoId`) [PROPUESTO - CRÍTICO]**  
  - *Limitación actual:* [`backend/src/models/pedidos.js#L23-L27`](file:///d:/VANGUARDIA/MIO/backend/src/models/pedidos.js#L23-L27) guarda el producto como un `String` con su nombre. No guarda referencia ObjectId a la pieza física.  
  - *Propuesto para Semana 2:* Reemplazar o complementar con `productoId: { type: ObjectId, ref: 'Producto', required: true }` para asegurar integridad referencial.

- **RF-12: Desacoplamiento de Pedido y Evento Live [PROPUESTO - CRÍTICO]**  
  - *Limitación actual:* [`backend/src/models/pedidos.js#L11-L15`](file:///d:/VANGUARDIA/MIO/backend/src/models/pedidos.js#L11-L15) y [`backend/src/services/pedidoService.js#L103-L105`](file:///d:/VANGUARDIA/MIO/backend/src/services/pedidoService.js#L103-L105) exigen `liveId` obligatorio y activo para crear cualquier pedido.  
  - *Propuesto para Semana 2:* Hacer `liveId` opcional, permitiendo apartados directos (mensajes de WhatsApp/Instagram fuera de un evento live).

- **RF-13: Reserva Atómica de Pieza Única [PROPUESTO - CRÍTICO]**  
  - *Estado actual:* No hay reserva atómica. El frontend ejecuta dos llamadas HTTP desacopladas: crea pedido y luego llama a `cambiarEstado('apartado')` ([`frontend/src/app/pages/live-activo/live-activo.ts#L285-L323`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/live-activo/live-activo.ts#L285-L323)).  
  - *Propuesto para Semana 2:* Operación atómica en backend (`findOneAndUpdate({ _id: productoId, estado: 'disponible' }, { $set: { estado: 'apartado' } })` o sesión/transacción de réplica) que rechace la solicitud si la pieza ya no está disponible.

- **RF-14: Restricción de Cantidad Unitaria en Piezas Únicas [PROPUESTO]**  
  - *Estado actual:* [`backend/src/models/pedidos.js#L29-L33`](file:///d:/VANGUARDIA/MIO/backend/src/models/pedidos.js#L29-L33) admite cualquier cantidad $\ge 1$.  
  - *Propuesto para Semana 3:* Forzar `cantidad: 1` para ítems del catálogo de piezas únicas.

- **RF-15: Congelamiento de Precio Histórico [PROPUESTO]**  
  El pedido debe almacenar el precio acordado en el momento del apartado. Cambios posteriores en el catálogo de productos no deben mutar pedidos ya cerrados.  
  *Referencia actual:* El pedido almacena un número `precio` ([`backend/src/models/pedidos.js#L35`](file:///d:/VANGUARDIA/MIO/backend/src/models/pedidos.js#L35)), pero se debe garantizar que no se actualice por cascadeo.

---

### Módulo 5: Consolidación por Cliente

- **RF-16: Vista de Pedidos Consolidados por Cliente [PROPUESTO]**  
  La tienda debe poder seleccionar un cliente y visualizar todos sus pedidos activos de distintas transmisiones o fechas en una sola vista agregada.  
  *Estado actual:* Solo existe filtrado en cliente en memoria de Angular ([`frontend/src/app/pages/pedidos/pedidos.ts#L366-L380`](file:///d:/VANGUARDIA/MIO/frontend/src/app/pages/pedidos/pedidos.ts#L366-L380)).

- **RF-17: Total Consolidado por Paquete de Cliente [PROPUESTO]**  
  El sistema debe calcular: Total Comprado = $\sum(\text{Precio de cada pieza})$; Total Abonado = $\sum(\text{Abonos confirmados})$; Saldo Global = Total Comprado $-$ Total Abonado.

---

### Módulo 6: Abonos y Control de Saldos

- **RF-18: Estructura de Abono Parcial [PROPUESTO - CRÍTICO]**  
  - *Estado actual:* Inexistente. [`backend/src/models/pedidos.js#L41-L45`](file:///d:/VANGUARDIA/MIO/backend/src/models/pedidos.js#L41-L45) únicamente tiene un enum binario `estadoPago: ["pendiente", "pagado"]`.  
  - *Propuesto para Semana 4:* Crear subdocumento o colección `abonos` con los campos:  
    `{ monto: Number, fecha: Date, metodoPago: String, referencia: String, comprobanteUrl: String, notas: String, registradoPor: ObjectId }`.

- **RF-19: Validación de Monto de Abono [PROPUESTO]**  
  Un abono debe ser un número estrictamente mayor que cero y no puede exceder el saldo pendiente del pedido o paquete consolidado.

- **RF-20: Saldo Dinámico Calculado en Servidor [PROPUESTO]**  
  El saldo pendiente no debe confiarse al cliente web. Debe computarse en backend mediante agregación o cálculo derivado:  
  $$\text{Saldo} = \text{Monto Total} - \sum \text{Abonos Válidos}$$

- **RF-21: Historial Trazable e Inmutable de Abonos [PROPUESTO]**  
  Los abonos registrados no se eliminan silenciosamente. Las correcciones deben registrarse con nota de ajuste o anulación trazable.

---

### Módulo 7: Cancelación y Reglas de Dinero

- **RF-22: Cancelación de Apartado con Liberación de Pieza [PROPUESTO]**  
  - *Estado actual:* Eliminar un pedido ([`backend/src/services/pedidoService.js#L271-L283`](file:///d:/VANGUARDIA/MIO/backend/src/services/pedidoService.js#L271-L283)) borra físicamente el documento de MongoDB sin alterar el estado del producto ni registrar motivo.  
  - *Propuesto para Semana 5:* Cancelación lógica (`estado: "cancelado"`). La pieza asociada debe retornar automáticamente a `estado: "activo"` (o `"disponible"`).

- **RF-23: Tratamiento Explícito del Dinero Abonado [PENDIENTE DE VALIDAR / PROPUESTO]**  
  Al cancelar un apartado que ya registra abonos, el sistema debe exigir a la tienda clasificar el destino del dinero recibido:
  - Opción A: Devolución registrada al cliente.
  - Opción B: Saldo a favor / crédito interno para futuras compras.
  - Opción C: Penalización / retenido por política de la tienda (no reembolsable).  
  *Nota:* La política predeterminada debe validarse en la entrevista con las tiendas.

- **RF-24: Expiración de Apartados [PENDIENTE DE VALIDAR / PROPUESTO]**  
  El sistema debe permitir configurar un plazo límite de apartado (ej. 24, 48 o 72 horas). Transcurrido el plazo sin abono, el sistema debe alertar al vendedor para confirmar la liberación de la pieza.

---

### Módulo 8: Control de Entregas

- **RF-25: Estados de Entrega [IMPLEMENTADO PARCIALMENTE]**  
  - *Estado actual:* [`backend/src/models/pedidos.js#L47-L51`](file:///d:/VANGUARDIA/MIO/backend/src/models/pedidos.js#L47-L51) tiene `estadoEntrega: ["pendiente", "entregado"]`.  
  - *Propuesto para Semana 5:* Registrar fecha y hora de entrega (`fechaEntrega`), método de entrega (recogido en tienda, entrega personal, envío nacional) y código de seguimiento de mensajería si aplica.

- **RF-26: Regla de Bloqueo de Entrega con Saldo Pendiente [PENDIENTE DE VALIDAR / PROPUESTO]**  
  El sistema debe advertir o impedir marcar un pedido como "entregado" si el saldo pendiente es mayor a cero, a menos que el vendedor marque explícitamente "Entrega contra pago en efectivo" o "Excepción autorizada".

---

### Módulo 9: Métricas, Resúmenes y Exportación

- **RF-27: Resumen Financiero por Evento Live [IMPLEMENTADO]**  
  El sistema calcula total de pedidos, total vendido, total pagado y total pendiente por Live.  
  *Referencia:* [`backend/src/services/resumenService.js`](file:///d:/VANGUARDIA/MIO/backend/src/services/resumenService.js).

- **RF-28: Resumen General de Tienda (Dashboard Global) [PROPUESTO]**  
  Vista general que presente el total de inventario disponible, total reservado/apartado en curso, dinero cobrado y dinero pendiente por cobrar de toda la tienda.

- **RF-29: Exportación de Datos a CSV [PROPUESTO]**  
  Capacidad de descargar un archivo CSV con la lista de pedidos consolidados, clientes, piezas, teléfonos y saldos para preparar paquetes de entrega o respaldo fuera de línea.

---

## 4. Requisitos No Funcionales (RNF)

- **RNF-01: Integridad Transaccional y Concurrencia**  
  Dos peticiones de apartado simultáneas para la misma pieza no deben resultar en dos apartados concedidos. El backend debe garantizar aislamiento a nivel de documento en MongoDB.

- **RNF-02: Aislamiento Estricto Multitienda (Seguridad de Datos)**  
  Toda consulta de lectura, escritura, actualización o agregación en MongoDB debe incluir obligatoriamente el identificador `vendedorId` extraído del token JWT verificado.

- **RNF-03: Agilidad de Captura en Tiempo Real**  
  La interfaz de apartado debe permitir registrar un pedido (selección de cliente rápido + pieza) en menos de 15 segundos durante una transmisión en vivo.

- **RNF-04: Adaptabilidad a Dispositivos Móviles (Responsive)**  
  La interfaz debe ser plenamente operable desde teléfonos inteligentes y tabletas, ya que las tiendas operan frecuentemente con un dispositivo secundario al lado de la cámara.

- **RNF-05: Mantenimiento de la Pila Tecnológica**  
  El sistema conservará la arquitectura establecida: Angular (v21), Express (v5) y MongoDB/Mongoose.

- **RNF-06: Trazabilidad y Auditoría de Movimientos**  
  No se permitirá la eliminación destructiva de pedidos con abonos asociados. Todo cambio de estado de pago o inventario debe conservar marca de tiempo (`timestamps: true`) y responsable.

- **RNF-07: Seguridad en Autenticación y Secretos**  
  Las contraseñas deben almacenarse con hashing `bcryptjs` (salt $\ge 10$). Los tokens JWT deben firmarse con secreto en variables de entorno. Los archivos de secretos (`.env`) nunca deben exponerse ni versionarse.

- **RNF-08: Factibilidad y Carga Cognitiva**  
  La arquitectura debe mantenerse simple y comprensible para el estudiante, permitiendo su defensa y mantenimiento bajo el tiempo disponible (~2 horas semanales).

---

## 5. Criterios Observables de Aceptación

Para que un requisito o incremento se considere terminado, debe superar los siguientes criterios empíricos y verificables:

1. **Unicidad de Códigos:**  
   - Si se intenta crear una pieza con un código ya existente en la misma tienda, el sistema devuelve código HTTP 409 y un mensaje amigable.  
   - Si otra tienda crea el mismo código, el sistema lo acepta con HTTP 201.
2. **Concurrencia de Apartado:**  
   - Al lanzar dos peticiones concurrentes de apartado para una misma pieza en estado "disponible", exactamente una obtiene éxito (HTTP 201) y la segunda es rechazada con conflicto (HTTP 409 o mensaje de "pieza ya apartada").
3. **Cálculo Matemático de Saldos:**  
   - Si una pieza cuesta L 500 y se registra un abono de L 200, el saldo mostrado debe ser exactamente L 300.  
   - Si se intenta registrar un abono de L 400 cuando el saldo es L 300, el sistema rechaza la operación con error descriptivo.
4. **Liberación en Cancelación:**  
   - Al cancelar un apartado, la pieza asociada cambia automáticamente su estado a disponible y vuelve a figurar en las búsquedas para nuevos apartados.
5. **Aislamiento Multitienda:**  
   - Al autenticar con las credenciales del Vendedor A e intentar consultar por URL (`/api/pedidos/:id`) o manipular el ID de un pedido perteneciente al Vendedor B, el sistema responde estrictamente HTTP 404 ("No encontrado").
6. **Desacoplamiento de Video:**  
   - El sistema opera de manera 100% funcional sin conexión a servicios de transmisión o APIs de redes sociales.
