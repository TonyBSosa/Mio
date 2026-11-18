const { test } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const validar = require('../src/services/validarComprobante');
const storage = require('../src/services/comprobanteStorage');

test('comprobantes: decodificación real, firmas, tamaño y re-encodeado sin metadatos', async () => {
  for (const [formato, mimetype] of [['jpeg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']]) {
    const buffer = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#159570' } }).toFormat(formato).toBuffer();
    const limpio = await validar({ buffer, size: buffer.length, mimetype });
    const meta = await sharp(limpio).metadata();
    assert.equal(meta.format, 'webp');
    assert.equal(meta.exif, undefined);
    await assert.rejects(validar({ buffer, size: 5242881, mimetype }), { status: 400 });
  }
  for (const contenido of ['<script>alert(1)</script>', '<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'no es una imagen']) {
    const buffer = Buffer.from(contenido);
    await assert.rejects(validar({ buffer, size: buffer.length, mimetype: 'image/png' }), { status: 400 });
  }
  const truncado = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await assert.rejects(validar({ buffer: truncado, size: truncado.length, mimetype: 'image/png' }), { status: 400 });
});

test('adaptador Supabase: bucket privado, upload, firma temporal, borrado y fallo seguro', async t => {
  process.env.SUPABASE_URL = 'https://storage.example.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key-not-a-credential';
  process.env.SUPABASE_COMPROBANTES_BUCKET = 'comprobantes-pruebas';
  const clave = '507f1f77bcf86cd799439020/507f1f77bcf86cd799439021/507f1f77bcf86cd799439022.webp';
  const llamadas = [];
  let publico = false;
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    llamadas.push({ url: String(url), opciones });
    const datos = String(url).includes('/bucket/') ? { id: 'comprobantes-pruebas', public: publico }
      : String(url).includes('/object/sign/') ? { signedURL: `/object/sign/comprobantes-pruebas/${clave}?token=test` } : {};
    return new Response(JSON.stringify(datos), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  await storage.subir(clave, Buffer.from('imagen normalizada de prueba'));
  const firmado = await storage.firmar(clave);
  assert.equal(firmado.duraSegundos, 60);
  assert.match(firmado.url, /^https:\/\/storage\.example\.invalid\/storage\/v1\/object\/sign\//);
  const firma = llamadas.find(l => l.url.includes('/object/sign/'));
  assert.equal(JSON.parse(firma.opciones.body).expiresIn, 60);
  await storage.eliminar(clave);
  assert.ok(llamadas.some(l => l.opciones.method === 'DELETE'));
  publico = true;
  await assert.rejects(storage.subir(clave, Buffer.from('test')), { status: 503 });
  await assert.rejects(storage.firmar(clave), { status: 503 });
  await assert.rejects(storage.firmar('../../otro-archivo'), { status: 503 });
});
