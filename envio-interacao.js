import { renderCustomEmojis } from '../discord/emojis.js';
import { responderPainel } from './resposta-painel.js';

export async function sendOrUpdate(interaction, payload, ephemeral = true) {
  const nextPayload = { ...payload };
  if (typeof nextPayload.content === 'string') {
    nextPayload.content = renderCustomEmojis(nextPayload.content);
  }
  // Nunca repasse ephemeral legado — responderPainel usa flags
  delete nextPayload.ephemeral;
  return responderPainel(interaction, nextPayload, ephemeral);
}
