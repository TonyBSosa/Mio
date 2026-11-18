/*
 * Consultas propuestas, NO ejecutadas contra MongoDB en el Incremento 0.
 * Usar mongosh autenticado por un operador con SOLO LECTURA, sin cargar Mongoose,
 * dotenv ni la aplicación. No contiene conexión, credenciales ni operaciones de escritura.
 * Antes de load(), definir globalThis.MIO_DIAGNOSTICO_AUTORIZADO = true y
 * globalThis.MIO_DIAGNOSTICO_BASE_ESPERADA con el nombre aprobado de la base.
 * Revisión de código y autorización de lectura de datos siguen siendo necesarias:
 * el flag NO prueba permisos del usuario conectado.
 * Salida: categorías y cantidades; nunca documentos, identificadores ni valores personales.
 */
(async function diagnosticoMio() {
  'use strict';
  if (globalThis.MIO_DIAGNOSTICO_AUTORIZADO !== true ||
      typeof globalThis.MIO_DIAGNOSTICO_BASE_ESPERADA !== 'string' ||
      typeof db === 'undefined' || db.getName() !== globalThis.MIO_DIAGNOSTICO_BASE_ESPERADA) {
    throw new Error('Diagnóstico no habilitado para una base aprobada. No se realizaron consultas.');
  }

  const unico = { unique: true };
  const ttl = { expireAfterSeconds: 0 };
  const parcialId = campo => ({ unique: true, partialFilterExpression: { [campo]: { $type: 'objectId' } } });
  const parcialEstados = estados => ({ unique: true, partialFilterExpression: { estado: estados } });
  const declarados = {
    usuarios: [[{ email: 1 }, unico]],
    sesiones: [[{ usuarioId: 1 }, {}], [{ expiresAt: 1 }, ttl]],
    recuperaciones: [[{ tokenHash: 1 }, unico], [{ expiresAt: 1 }, ttl]],
    perfiles_vendedores: [[{ vendedorId: 1 }, unico]],
    clientes: [[{ vendedorId: 1, usuarioId: 1 }, parcialId('usuarioId')]],
    productos: [[{ vendedorId: 1, codigo: 1 }, { unique: true, partialFilterExpression: { codigo: { $type: 'string' } } }]],
    lives: [],
    pedidos: [[{ reservaSolicitudId: 1 }, parcialId('reservaSolicitudId')]],
    comprobantes: [[{ reservaId: 1 }, parcialEstados('preparando')], [{ reservaId: 1, createdAt: -1 }, {}],
      [{ estado: 1, finalizaCargaEn: 1 }, {}], [{ estado: 1, limpiezaPendiente: 1, ultimaLimpiezaEn: 1 }, {}]],
    solicitudes_apartado: [
      [{ compradorId: 1, productoId: 1 }, parcialEstados('pendiente')],
      [{ compradorId: 1, createdAt: -1 }, {}],
      [{ compradorId: 1, productoId: 1 }, parcialEstados({ $in: ['pendiente', 'confirmada'] })],
      [{ vendedorId: 1, createdAt: -1 }, {}],
      [{ compradorId: 1, productoId: 1 }, parcialEstados({ $in: ['pendiente', 'confirmada', 'comprobante_en_revision'] })],
      [{ estado: 1, esPrueba: 1, venceEn: 1 }, {}],
      [{ compradorId: 1, productoId: 1 }, parcialEstados({ $in: ['pendiente', 'confirmada', 'comprobante_en_revision', 'comprobante_rechazado', 'pagada'] })],
      [{ estado: 1, esPrueba: 1, corregirHasta: 1 }, {}],
    ],
  };
  // [origen, campo, destino, obligatorio, rol esperado si procede].
  const relaciones = [
    ['sesiones', 'usuarioId', 'usuarios', true],
    ['recuperaciones', 'usuarioId', 'usuarios', true],
    ['perfiles_vendedores', 'vendedorId', 'usuarios', true, 'vendedor'],
    ['clientes', 'vendedorId', 'usuarios', true, 'vendedor'],
    ['clientes', 'usuarioId', 'usuarios', false],
    ['productos', 'vendedorId', 'usuarios', true, 'vendedor'],
    ['productos', 'reservaSolicitudId', 'solicitudes_apartado', false],
    ['lives', 'vendedorId', 'usuarios', true, 'vendedor'],
    ['pedidos', 'vendedorId', 'usuarios', true, 'vendedor'],
    ['pedidos', 'clienteId', 'clientes', true],
    ['pedidos', 'productoId', 'productos', false],
    ['pedidos', 'liveId', 'lives', false],
    ['pedidos', 'reservaSolicitudId', 'solicitudes_apartado', false],
    ['pedidos', 'comprobanteId', 'comprobantes', false],
    ['solicitudes_apartado', 'compradorId', 'usuarios', true],
    ['solicitudes_apartado', 'vendedorId', 'usuarios', true, 'vendedor'],
    ['solicitudes_apartado', 'productoId', 'productos', true],
    ['solicitudes_apartado', 'pedidoId', 'pedidos', false],
    ['solicitudes_apartado', 'comprobanteActualId', 'comprobantes', false],
    ['comprobantes', 'reservaId', 'solicitudes_apartado', true],
    ['comprobantes', 'compradorId', 'usuarios', true],
    ['comprobantes', 'vendedorId', 'usuarios', true, 'vendedor'],
    ['comprobantes', 'revisadoPor', 'usuarios', false],
  ];
  const coherencias = [
    ['pedidos', 'clienteId', 'clientes', [['vendedorId', 'vendedorId']]],
    ['pedidos', 'productoId', 'productos', [['vendedorId', 'vendedorId']]],
    ['pedidos', 'liveId', 'lives', [['vendedorId', 'vendedorId']]],
    ['pedidos', 'reservaSolicitudId', 'solicitudes_apartado', [['vendedorId', 'vendedorId'], ['productoId', 'productoId']]],
    ['pedidos', 'comprobanteId', 'comprobantes', [['vendedorId', 'vendedorId'], ['reservaSolicitudId', 'reservaId']]],
    ['solicitudes_apartado', 'productoId', 'productos', [['vendedorId', 'vendedorId']]],
    ['solicitudes_apartado', 'pedidoId', 'pedidos', [['_id', 'reservaSolicitudId'], ['vendedorId', 'vendedorId']]],
    ['solicitudes_apartado', 'comprobanteActualId', 'comprobantes', [['_id', 'reservaId'], ['compradorId', 'compradorId'], ['vendedorId', 'vendedorId']]],
    ['comprobantes', 'reservaId', 'solicitudes_apartado', [['compradorId', 'compradorId'], ['vendedorId', 'vendedorId']]],
  ];
  const opciones = { maxTimeMS: 10000, allowDiskUse: false, collation: { locale: 'simple' } };
  const limiteDocumentos = 100000;
  const emitir = (categoria, datos) => print(JSON.stringify({ categoria, ...datos }));
  // Evitar e.message: un error del motor puede incluir valores de documentos.
  const seguro = async (categoria, fn) => {
    try { await fn(); }
    catch { emitir(categoria, { estado: 'pendiente', motivo: 'consulta_no_completada_o_sin_permiso' }); }
  };
  const contar = async (coleccion, etapas, categoria) => seguro(categoria, async () => {
    const resultado = await db.getCollection(coleccion).aggregate(
      [...etapas, { $count: 'cantidad' }], opciones).toArray();
    emitir(categoria, { estado: 'verificado_en_base_consultada', cantidad: resultado[0]?.cantidad || 0 });
  });
  const C = ['usuarios', 'sesiones', 'recuperaciones', 'perfiles_vendedores',
    'clientes', 'productos', 'lives', 'pedidos', 'solicitudes_apartado', 'comprobantes'];
  // Catálogo indispensable: ausencia de colección no debe aparentar cero conflictos.
  let existentes;
  try {
    existentes = new Set((await db.getCollectionInfos({}, true)).map(c => c.name));
  } catch {
    emitir('inventario', { estado: 'pendiente', motivo: 'sin_catalogo_no_se_inicia_diagnostico' });
    return;
  }
  const presente = nombre => existentes.has(nombre);
  for (const nombre of C) {
    emitir('coleccion.' + nombre, { estado: presente(nombre) ? 'verificado_en_base_consultada' : 'pendiente',
      presente: presente(nombre) });
    if (presente(nombre)) await contar(nombre, [], 'total.' + nombre);
  }

  // listIndexes explícito, sin creación ni sincronización. Completa todo el cursor.
  // Solo resume cantidad y clases de índices; nombres/filtros reales no salen del proceso.
  for (const nombre of C.filter(presente)) await seguro('indices.' + nombre, async () => {
    const respuesta = await db.runCommand({ listIndexes: nombre, cursor: { batchSize: 100 }, maxTimeMS: 10000 });
    if (respuesta.ok !== 1 || !respuesta.cursor) throw new Error('listIndexes no completado');
    let cursor = respuesta.cursor;
    const indices = [...cursor.firstBatch];
    while (String(cursor.id) !== '0') {
      const pagina = await db.runCommand({ getMore: cursor.id, collection: nombre, batchSize: 100 });
      if (pagina.ok !== 1 || !pagina.cursor) throw new Error('cursor no completado');
      cursor = pagina.cursor;
      indices.push(...cursor.nextBatch);
    }
    emitir('indices.' + nombre, { estado: 'verificado_en_base_consultada', cantidad: indices.length,
      unicos: indices.filter(i => i.unique === true).length,
      ttl: indices.filter(i => i.expireAfterSeconds !== undefined).length,
      parciales: indices.filter(i => i.partialFilterExpression !== undefined).length });
    // Comparación estructural con especificaciones declaradas en este checkout.
    const esperados = declarados[nombre] || [];
    for (let numero = 0; numero < esperados.length; numero++) {
      const [key, opcionesEsperadas] = esperados[numero];
      const mismaClave = indices.filter(i => JSON.stringify(i.key) === JSON.stringify(key));
      const conforme = mismaClave.some(i => {
        const filtro = i.partialFilterExpression;
        return Boolean(i.unique) === Boolean(opcionesEsperadas.unique) &&
          i.expireAfterSeconds === opcionesEsperadas.expireAfterSeconds &&
          JSON.stringify(filtro) === JSON.stringify(opcionesEsperadas.partialFilterExpression) &&
          !i.sparse && !i.hidden && (!i.collation || i.collation.locale === 'simple');
      });
      emitir('indice_declarado.' + nombre + '.' + (numero + 1), {
        estado: 'verificado_en_base_consultada',
        resultado: conforme ? 'coincide_estructura' : mismaClave.length ? 'opciones_difieren' : 'clave_no_encontrada',
      });
    }
  });

  // Normalización en cliente: reproduce trim().toLowerCase() de la API para correo.
  // Lee solo el campo elegido, nunca password/tokenHash ni documentos completos.
  const duplicadosTexto = async (coleccion, campo, normalizar, categoria) => seguro(categoria, async () => {
    const cursor = db.getCollection(coleccion).find({}, { _id: 0, [campo]: 1 })
      .maxTimeMS(10000).batchSize(500).limit(limiteDocumentos + 1);
    const frecuencias = new Map();
    let total = 0, ausentes = 0, tiposInvalidos = 0, vacios = 0, formatoSospechoso = 0;
    try {
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        if (++total > limiteDocumentos) {
          emitir(categoria, { estado: 'pendiente', motivo: 'limite_de_lectura_superado_sin_conclusion' });
          return;
        }
        const valor = doc[campo];
        if (valor === undefined || valor === null) { ausentes++; continue; }
        if (typeof valor !== 'string') { tiposInvalidos++; continue; }
        const clave = normalizar(valor);
        if (!clave) { vacios++; continue; }
        // Heurística de diagnóstico, no validador RFC ni prueba de entrega/control del buzón.
        if (campo === 'email' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(clave) || clave.length > 254)) formatoSospechoso++;
        frecuencias.set(clave, (frecuencias.get(clave) || 0) + 1);
      }
      let grupos = 0, documentosEnConflicto = 0, excedentes = 0;
      for (const cantidad of frecuencias.values()) if (cantidad > 1) {
        grupos++; documentosEnConflicto += cantidad; excedentes += cantidad - 1;
      }
      emitir(categoria, { estado: 'verificado_en_base_consultada', total, ausentes,
        tiposInvalidos, vacios, formatoSospechoso, grupos, documentosEnConflicto, excedentes });
    } finally { await cursor.close(); frecuencias.clear(); }
  });
  if (presente('usuarios')) await duplicadosTexto('usuarios', 'email',
    s => s.trim().toLowerCase(), 'correo.normalizacion_actual');
  if (presente('perfiles_vendedores')) {
    await duplicadosTexto('perfiles_vendedores', 'nombrePublico',
      s => s.trim().toLowerCase().replace(/\s+/gu, ' '), 'tiendas.mayusculas_espacios');
    await duplicadosTexto('perfiles_vendedores', 'nombrePublico',
      s => s.normalize('NFKC').trim().toLowerCase().replace(/\s+/gu, ' ')
        .replace(/[áàâä]/gu, 'a').replace(/[éèêë]/gu, 'e').replace(/[íìîï]/gu, 'i')
        .replace(/[óòôö]/gu, 'o').replace(/[úùûü]/gu, 'u'), 'tiendas.politica_propuesta_acentos');
    // Las dos categorías de tiendas son escenarios diferentes, NO se suman.
    await seguro('perfiles.propietario_repetido', async () => {
      const r = await db.getCollection('perfiles_vendedores').aggregate([
        { $match: { vendedorId: { $type: 'objectId' } } },
        { $group: { _id: '$vendedorId', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } },
        { $group: { _id: null, grupos: { $sum: 1 }, documentosEnConflicto: { $sum: '$n' },
          excedentes: { $sum: { $subtract: ['$n', 1] } } } }, { $project: { _id: 0 } },
      ], opciones).toArray();
      emitir('perfiles.propietario_repetido', { estado: 'verificado_en_base_consultada',
        ...(r[0] || { grupos: 0, documentosEnConflicto: 0, excedentes: 0 }) });
    });
  }

  // Referencias: ausencia opcional es legítima; ausencia obligatoria, tipo y orfandad
  // son categorías distintas. Un string con apariencia de ObjectId NO se convierte.
  for (const [origen, campo, destino, obligatorio, rolEsperado] of relaciones) {
    const categoria = 'relacion.' + origen + '.' + campo;
    if (!presente(origen) || !presente(destino)) {
      emitir(categoria, { estado: 'pendiente', motivo: 'coleccion_origen_o_destino_ausente' }); continue;
    }
    await seguro(categoria, async () => {
      const ausente = { $in: [{ $type: '$' + campo }, ['missing', 'null']] };
      const etapas = [
        { $project: { [campo]: 1 } },
        { $lookup: { from: destino, let: { id: '$' + campo }, pipeline: [
          { $match: { $expr: { $and: [
            { $eq: [{ $type: '$$id' }, 'objectId'] }, { $eq: ['$_id', '$$id'] },
          ] } } }, { $project: { _id: 1, rol: 1, estado: 1 } },
        ], as: 'destino' } },
        { $project: { categoria: { $switch: { branches: [
          { case: ausente, then: obligatorio ? 'ausente_obligatoria' : 'no_aplicable_opcional_ausente' },
          { case: { $ne: [{ $type: '$' + campo }, 'objectId'] }, then: 'tipo_invalido' },
          { case: { $eq: [{ $size: '$destino' }, 0] }, then: 'huerfana' },
          ...(rolEsperado ? [{ case: { $ne: [{ $arrayElemAt: ['$destino.rol', 0] }, rolEsperado] }, then: 'rol_no_esperado_revisar_historia' }] : []),
          ...(destino === 'usuarios' ? [{ case: { $ne: [{ $arrayElemAt: ['$destino.estado', 0] }, 'activo'] }, then: 'usuario_no_activo_no_es_huerfano' }] : []),
        ], default: 'referencia_existente' } } } },
        { $group: { _id: '$categoria', cantidad: { $sum: 1 } } },
        { $project: { _id: 0, categoria: '$_id', cantidad: 1 } },
      ];
      const categorias = await db.getCollection(origen).aggregate(etapas, opciones).toArray();
      emitir(categoria, { estado: 'verificado_en_base_consultada', categorias });
    });
  }

  // Existir no basta: comparar propietario y enlaces recíprocos cuando ambos existen.
  for (const [origen, referencia, destino, pares] of coherencias) {
    const categoria = 'coherencia.' + origen + '.' + referencia;
    if (!presente(origen) || !presente(destino)) {
      emitir(categoria, { estado: 'pendiente', motivo: 'coleccion_ausente' }); continue;
    }
    const proyeccion = Object.fromEntries(['_id', referencia, ...pares.map(p => p[0])].map(k => [k, 1]));
    const destinoProyeccion = Object.fromEntries(['_id', ...pares.map(p => p[1])].map(k => [k, 1]));
    await contar(origen, [
      { $match: { [referencia]: { $type: 'objectId' } } }, { $project: proyeccion },
      { $lookup: { from: destino, let: { id: '$' + referencia }, pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$id'] } } }, { $project: destinoProyeccion },
      ], as: 'destino' } }, { $unwind: '$destino' },
      { $match: { $expr: { $or: pares.map(([a, b]) => ({
        $ne: [{ $ifNull: ['$' + a, null] }, { $ifNull: ['$destino.' + b, null] }],
      })) } } },
    ], categoria);
  }
  emitir('fin', { estado: 'finalizado', nota: 'Los pendientes no equivalen a cero; conteos por categoria pueden superponerse.' });

})();
