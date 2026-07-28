import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Sempre relativo à pasta do bot (onde ficam package.json / assets),
// independente de de onde o npm/node for executado.
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ASSET_DIR = path.join(ROOT_DIR, 'assets');

export const ASSETS = {
  mainBannerFile: 'Noite.png',
  // Fallback só se o arquivo local não existir
  mainBannerFallback: '',
  botAvatar: 'https://cdn.discordapp.com/avatars/1518014163895586816/567fa4321f043b925f5fd09c0aa71ef5.webp?size=256',
  ticketBanner: 'https://media.discordapp.net/attachments/1358115100032106506/1366529704219246673/ZenSallers.png',
};

export function assetPath(name) {
  return path.join(ASSET_DIR, name);
}

export function localAsset(name) {
  const file = assetPath(name);
  if (!existsSync(file)) return null;
  return { attachment: file, name };
}

export function getRootDir() {
  return ROOT_DIR;
}
