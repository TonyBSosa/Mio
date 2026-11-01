const explorarPublicoRepository = require("../repositories/explorarPublicoRepository");

const crearMapaUsuarios = (usuarios = []) => {
  const mapa = new Map();
  for (const u of usuarios) {
    if (u && u._id) {
      mapa.set(String(u._id), u);
    }
  }
  return mapa;
};

const esVendedorVisible = (vendedorId, mapaUsuarios) => {
  if (!mapaUsuarios || mapaUsuarios.size === 0) {
    return true;
  }
  return mapaUsuarios.has(String(vendedorId));
};

const formatearPerfil = (perfil, mapaUsuarios) => {
  const usuario = mapaUsuarios?.get(String(perfil.vendedorId));

  return {
    vendedorId: perfil.vendedorId,
    nombrePublico: perfil.nombrePublico || usuario?.nombre || "",
    descripcion: perfil.descripcion || "",
    facebook: perfil.facebook || "",
    instagram: perfil.instagram || "",
    tiktok: perfil.tiktok || "",
    whatsapp: perfil.whatsapp || "",
    enlaceLive: perfil.enlaceLive || ""
  };
};

const formatearEvento = (live, perfiles, mapaUsuarios) => {
  const vendedorId = live.vendedorId ? live.vendedorId.toString() : "";
  const perfil = perfiles.find(
    (perfilItem) => perfilItem.vendedorId.toString() === vendedorId
  );
  const usuario = mapaUsuarios?.get(vendedorId);

  return {
    _id: live._id,
    nombre: live.nombre,
    descripcion: live.descripcion,
    fecha: live.fecha,
    estado: live.estado,
    vendedorId: live.vendedorId,
    nombrePublico:
      (perfil && perfil.nombrePublico) || usuario?.nombre || ""
  };
};

const listarVendedores = async () => {
  const [perfiles, usuariosActivos] = await Promise.all([
    explorarPublicoRepository.listarPerfilesActivos(),
    explorarPublicoRepository.listarVendedoresUsuariosActivos?.() || []
  ]);

  const mapaUsuarios = crearMapaUsuarios(usuariosActivos);

  return perfiles
    .filter((perfil) => esVendedorVisible(perfil.vendedorId, mapaUsuarios))
    .map((perfil) => formatearPerfil(perfil, mapaUsuarios));
};

const listarEventos = async () => {
  const [perfiles, eventos, usuariosActivos] = await Promise.all([
    explorarPublicoRepository.listarPerfilesActivos(),
    explorarPublicoRepository.listarEventosPublicos(),
    explorarPublicoRepository.listarVendedoresUsuariosActivos?.() || []
  ]);

  const mapaUsuarios = crearMapaUsuarios(usuariosActivos);

  return eventos
    .filter((evento) => esVendedorVisible(evento.vendedorId, mapaUsuarios))
    .map((evento) => formatearEvento(evento, perfiles, mapaUsuarios));
};

const buscar = async (texto) => {
  const textoLimpio = typeof texto === "string" ? texto.trim() : "";

  if (!textoLimpio) {
    return {
      vendedores: [],
      eventos: []
    };
  }

  const [perfiles, eventos, perfilesActivos, usuariosActivos] =
    await Promise.all([
      explorarPublicoRepository.buscarPerfiles(textoLimpio),
      explorarPublicoRepository.buscarEventos(textoLimpio),
      explorarPublicoRepository.listarPerfilesActivos(),
      explorarPublicoRepository.listarVendedoresUsuariosActivos?.() || []
    ]);

  const mapaUsuarios = crearMapaUsuarios(usuariosActivos);

  return {
    vendedores: perfiles
      .filter((perfil) => esVendedorVisible(perfil.vendedorId, mapaUsuarios))
      .map((perfil) => formatearPerfil(perfil, mapaUsuarios)),
    eventos: eventos
      .filter((evento) => esVendedorVisible(evento.vendedorId, mapaUsuarios))
      .map((evento) => formatearEvento(evento, perfilesActivos, mapaUsuarios))
  };
};

module.exports = {
  listarVendedores,
  listarEventos,
  buscar
};
