import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
// Branding Flow — núcleo; remoção quebra o boot (ver infraestrutura/creditos.js)
import { CREDIT_BANNER, CREDIT_TAG, garantirCreditos } from './infraestrutura/creditos.js';
import { iniciarBot } from './aplicacao/iniciar-bot.js';

garantirCreditos();
console.log(CREDIT_BANNER);
console.log(`  base: ${CREDIT_TAG}\n`);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../config.json');

console.log('--- DIAGNÓSTICO DO CONFIG ---');
console.log('Diretório atual de execução:', process.cwd());
console.log('Caminho do config.json:', configPath);
console.log('config.json existe:', existsSync(configPath) ? 'Sim ✅' : 'Não ❌');
console.log('-----------------------------');

await iniciarBot();
