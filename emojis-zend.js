import path from 'node:path';

export const PASTA_EMOJIS_ZEND = path.join(process.cwd(), 'discord-emojis', 'upload');
export const ARQUIVO_METADADOS_EMOJIS_ZEND = path.join(process.cwd(), 'discord-emojis', 'metadata.json');
export const EXTENSOES_EMOJI_ZEND = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

export const SINCRONIA_EMOJI_ZEND = {
  escopo: 'application',
  origem: 'discord-emojis/upload',
  descricao: 'Os emojis ficam como arquivos locais e sao sincronizados no aplicativo do bot, sem usar slots do servidor.',
};
