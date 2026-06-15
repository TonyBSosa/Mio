const explorarPublicoRepository = require("../repositories/explorarPublicoRepository");

const formatearPerfil = (perfil) => {
  return {
    vendedorId: perfil.vendedorId,
    nombrePublico: perfil.nombrePublico || "",
    descripcion: perfil.descripcion || "",
    facebook: perfil.facebook || "",
    instagram: perfil.instagram || "",
    tiktok: perfil.tiktok || "",
    whatsapp: perfil.whatsapp || "",
    enlaceLive: perfil.enlaceLive || ""
  };
};

const formatearEvento = (live, perfiles) => {
  const vendedorId = live.vendedorId ? live.vendedorId.toString() : "";
  const perfil = perfiles.find(
    (perfilItem) => perfilItem.vendedorId.toString() === vendedorId
  );

  return {
    _id: live._id,
    nombre: live.nombre,
    descripcion: live.descripcion,
    fecha: live.fecha,
    estado: live.estado,
    vendedorId: live.vendedorId,
    nombrePublico: perfil ? perfil.nombrePublico || "" : ""
  };
};

const listarVendedores = async () => {
  const perfiles = await explorarPublicoRepository.listarPerfilesActivos();

  return perfiles.map(formatearPerfil);
};

const listarEventos = async () => {
  const perfiles = await explorarPublicoRepository.listarPerfilesActivos();
  const eventos = await explorarPublicoRepository.listarEventosPublicos();

  return eventos.map((evento) => formatearEvento(evento, perfiles));
};

const buscar = async (texto) => {
  if (!texto) {
    return {
      vendedores: [],
      eventos: []
    };
  }

  const perfiles = await explorarPublicoRepository.buscarPerfiles(texto);
  const eventos = await explorarPublicoRepository.buscarEventos(texto);
  const perfilesActivos = await explorarPublicoRepository.listarPerfilesActivos();

  return {
    vendedores: perfiles.map(formatearPerfil),
    eventos: eventos.map((evento) => formatearEvento(evento, perfilesActivos))
  };
};

module.exports = {
  listarVendedores,
  listarEventos,
  buscar
};
