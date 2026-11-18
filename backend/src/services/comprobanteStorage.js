const { createClient } = require('@supabase/supabase-js');
const error = mensaje => Object.assign(new Error(mensaje), { status: 503 });

const configurado = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_COMPROBANTES_BUCKET);
const conexion = () => {
  if (!configurado()) throw error('El almacenamiento privado de comprobantes todavía no está configurado.');
  if (!/^https:\/\//.test(process.env.SUPABASE_URL) || !/^[a-z0-9-]+$/.test(process.env.SUPABASE_COMPROBANTES_BUCKET)) throw error('La configuración del almacenamiento privado no es válida.');
  const cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, opciones) => fetch(url, { ...opciones, signal: AbortSignal.timeout(15000) }) },
  });
  return { cliente, bucket: process.env.SUPABASE_COMPROBANTES_BUCKET };
};
const privado = async () => {
  const { cliente, bucket } = conexion();
  const { data, error: fallo } = await cliente.storage.getBucket(bucket);
  if (fallo || !data || data.public !== false) throw error('No se pudo verificar que el bucket de comprobantes sea privado.');
  return cliente.storage.from(bucket);
};
const validarClave = clave => {
  if (!/^[a-f\d]{24}\/[a-f\d]{24}\/[a-f\d]{24}\.webp$/i.test(clave || '')) throw error('Referencia de archivo inválida.');
};

module.exports = {
  configurado,
  subir: async (clave, buffer) => {
    validarClave(clave);
    const bucket = await privado();
    const { error: fallo } = await bucket.upload(clave, buffer, { contentType: 'image/webp', upsert: false, cacheControl: '0' });
    if (fallo) throw error('No se pudo guardar el comprobante. Intentá de nuevo.');
  },
  firmar: async clave => {
    validarClave(clave);
    const bucket = await privado();
    const { data, error: fallo } = await bucket.createSignedUrl(clave, 60);
    if (fallo || !data?.signedUrl) throw error('No se pudo abrir el comprobante. Intentá de nuevo.');
    return { url: data.signedUrl, duraSegundos: 60 };
  },
  eliminar: async clave => {
    validarClave(clave);
    const bucket = await privado();
    const { error: fallo } = await bucket.remove([clave]);
    if (fallo) throw error('No se completó la limpieza del archivo fallido.');
  },
};
