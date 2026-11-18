const sharp = require('sharp');
const tipos = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
module.exports = async archivo => {
  const error = mensaje => Object.assign(new Error(mensaje), { status: 400 });
  if (!archivo?.buffer?.length || archivo.size > 5242880 || archivo.buffer.length > 5242880) throw error('Adjuntá una imagen de hasta 5 MB.');
  const b = archivo.buffer;
  const firma = b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png'
    : b[0] === 255 && b[1] === 216 && b[2] === 255 ? 'image/jpeg'
    : b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : '';
  if (firma !== archivo.mimetype || !firma) throw error('El contenido del archivo no coincide con una imagen permitida.');
  try {
    const imagen = sharp(archivo.buffer, { failOn: 'warning', limitInputPixels: 20000000 });
    const metadata = await imagen.metadata();
    if (!tipos[metadata.format] || tipos[metadata.format] !== archivo.mimetype || (metadata.pages || 1) !== 1) {
      throw error('Solo se aceptan imágenes JPG, PNG o WebP estáticas con contenido válido.');
    }
    // Decodificar completamente y re-encodear elimina metadatos, scripts/tráilers y el nombre original.
    const buffer = await imagen.rotate().webp({ quality: 90 }).toBuffer();
    if (buffer.length > 5242880) throw error('La imagen procesada supera los 5 MB.');
    return buffer;
  } catch (causa) {
    if (causa.status) throw causa;
    throw error('El archivo no contiene una imagen válida o está dañado.');
  }
};
