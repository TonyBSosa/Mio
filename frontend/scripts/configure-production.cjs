const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const apiUrl = process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, '');
if (!apiUrl) throw new Error('Configura PUBLIC_API_URL con https://TU-API.onrender.com/api');
const parsed = new URL(apiUrl);
if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/api') {
  throw new Error('PUBLIC_API_URL debe ser una URL HTTPS sin credenciales que termine en /api');
}
writeFileSync(
  join(__dirname, '../src/environments/environment.production.ts'),
  `// Generado para despliegue. Esta URL es publica; no incluir secretos.\nexport const environment = ${JSON.stringify({ production: true, apiUrl })};\n`,
);
