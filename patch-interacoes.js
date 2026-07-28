/**
 * - Converte ephemeral:true → flags: MessageFlags.Ephemeral (sem warning)
 * - Engole 10062/40060 (interação expirada / já respondida) para não spammar log
 */

import {
  CommandInteraction,
  MessageComponentInteraction,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';

const IGNORAR = new Set([10062, 40060]);

function normalizarOpcoes(options) {
  if (options == null || typeof options !== 'object' || Array.isArray(options)) {
    return options;
  }

  let next = { ...options };
  let flags = typeof next.flags === 'number' ? next.flags : 0;

  // ephemeral → flags (preserva IsComponentsV2 se existir)
  if (Object.prototype.hasOwnProperty.call(next, 'ephemeral')) {
    if (next.ephemeral) flags |= MessageFlags.Ephemeral;
    delete next.ephemeral;
  }

  // Components V2: remove content/embeds (API rejeita)
  const isV2 = Boolean(flags & MessageFlags.IsComponentsV2);
  if (isV2) {
    delete next.content;
    delete next.embeds;
    delete next.stickers;
    delete next.poll;
  }

  if (flags) next.flags = flags;
  else delete next.flags;

  return next;
}

function patchMethod(proto, name) {
  const original = proto[name];
  if (typeof original !== 'function' || original.__zendPatched) return;

  const wrapped = async function patchedInteractionMethod(options, ...args) {
    try {
      return await original.call(this, normalizarOpcoes(options), ...args);
    } catch (err) {
      if (err && IGNORAR.has(err.code)) return null;
      throw err;
    }
  };

  wrapped.__zendPatched = true;
  proto[name] = wrapped;
}

export function patchInteracoesDiscord() {
  const protos = [
    CommandInteraction?.prototype,
    MessageComponentInteraction?.prototype,
    ModalSubmitInteraction?.prototype,
  ].filter(Boolean);

  for (const proto of protos) {
    for (const method of ['reply', 'followUp', 'deferReply', 'update', 'deferUpdate', 'editReply']) {
      if (typeof proto[method] === 'function') patchMethod(proto, method);
    }
  }
}
