import { MessageFlags } from 'discord.js';

const IGNORAR = new Set([10062, 40060]);
const FLAG_V2 = MessageFlags.IsComponentsV2;
const FLAG_EPHEMERAL = MessageFlags.Ephemeral;

function veioDeComponente(interaction) {
  return (
    interaction.isButton?.() ||
    interaction.isStringSelectMenu?.() ||
    interaction.isChannelSelectMenu?.() ||
    interaction.isRoleSelectMenu?.() ||
    (interaction.isModalSubmit?.() && interaction.isFromMessage?.())
  );
}

/** Detecta se o payload é Components V2 */
export function isComponentsV2Payload(payload = {}) {
  const flags = Number(payload.flags || 0);
  if (flags & FLAG_V2) return true;
  // Heurística: builders/componentes V2 sem embeds
  const comps = payload.components;
  if (!Array.isArray(comps) || !comps.length) return false;
  if (payload.embeds?.length) return false;
  return comps.some((c) => {
    const type = c?.data?.type ?? c?.type;
    // 17 Container, 10 TextDisplay, 12 MediaGallery, 14 Separator, 9 Section
    return [9, 10, 12, 14, 17].includes(type);
  });
}

/**
 * Normaliza payload para envio/edição.
 * Components V2: NÃO pode ter content/embeds/stickers.
 * Classic: limpa anexos antigos e mantém embeds.
 */
export function normalizarPainel(payload = {}, { forEdit = false } = {}) {
  const v2 = isComponentsV2Payload(payload);
  const temArquivos = Array.isArray(payload.files) && payload.files.length > 0;

  if (v2) {
    let flags = Number(payload.flags || 0) | FLAG_V2;
    // Em edição, o Discord exige manter IsComponentsV2 em mensagens V2
    if (payload.ephemeral) flags |= FLAG_EPHEMERAL;

    const painel = {
      components: payload.components || [],
      flags,
    };

    // V2 proíbe content/embeds — nunca enviar
    // files/attachments só se o painel pediu (raro em V2; MediaGallery usa URL)

    if (temArquivos) {
      painel.files = payload.files;
    }

    // Em edição, limpa attachments antigos se não houver files novos
    if (forEdit && !temArquivos) {
      painel.attachments = [];
    }

    return painel;
  }

  // ── Embed clássico ──────────────────────────────────────
  const painel = {
    ...payload,
    content: payload.content ?? null,
    embeds: payload.embeds ?? [],
    components: payload.components ?? [],
    attachments: [],
  };

  if (!temArquivos) {
    delete painel.files;
  }

  // ephemeral legado → flags (sem IsComponentsV2)
  let flags = typeof painel.flags === 'number' ? painel.flags : 0;
  // remove bit V2 se alguém misturou por engano
  flags &= ~FLAG_V2;
  if (painel.ephemeral) flags |= FLAG_EPHEMERAL;
  delete painel.ephemeral;

  if (flags) painel.flags = flags;
  else delete painel.flags;

  return painel;
}

/**
 * Responde/atualiza painel com suporte correto a Components V2.
 */
export async function responderPainel(interaction, payload, efemero = true) {
  const v2 = isComponentsV2Payload(payload);
  let raw = { ...payload };

  // Ephemeral em reply/followUp (não em update de mensagem pública)
  if (efemero && !veioDeComponente(interaction)) {
    raw.flags = Number(raw.flags || 0) | FLAG_EPHEMERAL;
  }
  if (v2) {
    raw.flags = Number(raw.flags || 0) | FLAG_V2;
  }

  try {
    // Componentes (botão/select): deferUpdate → editReply
    if (veioDeComponente(interaction)) {
      // Mensagem original era V2? Precisa manter flag na edição
      const msgFlags = Number(interaction.message?.flags?.bitfield ?? interaction.message?.flags ?? 0);
      const originalV2 = Boolean(msgFlags & FLAG_V2);

      // Não dá para converter V1↔V2 no mesmo message edit de forma confiável
      if (originalV2 !== v2 && (originalV2 || v2)) {
        // Responde ephemeral com o painel novo (ou update se ambos classic já tratado)
        // Para troca de modo: envia nova mensagem ephemeral
        const painelNovo = normalizarPainel(
          { ...raw, flags: Number(raw.flags || 0) | (efemero ? FLAG_EPHEMERAL : 0) | (v2 ? FLAG_V2 : 0) },
        );
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferUpdate().catch(() => null);
        }
        // Edita a mensagem do componente só se mesmo "modo"
        // Se modos diferem, followUp com o resultado
        try {
          if (originalV2 === v2) {
            return await interaction.editReply(normalizarPainel(raw, { forEdit: true }));
          }
        } catch {
          /* fallthrough */
        }
        return await interaction.followUp(painelNovo).catch(() => null);
      }

      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.deferUpdate();
        } catch (err) {
          if (!IGNORAR.has(err?.code)) {
            try {
              return await interaction.update(normalizarPainel(raw, { forEdit: true }));
            } catch {
              return null;
            }
          }
        }
      }

      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply(normalizarPainel(raw, { forEdit: true }));
      }

      return await interaction.update(normalizarPainel(raw, { forEdit: true }));
    }

    // Slash / reply inicial
    const resposta = normalizarPainel(raw);
    if (efemero) {
      resposta.flags = Number(resposta.flags || 0) | FLAG_EPHEMERAL;
    }

    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(resposta);
    }
    return await interaction.reply(resposta);
  } catch (err) {
    if (IGNORAR.has(err?.code)) return null;
    // Log útil pra debug de V2
    if (v2) {
      console.error('[ComponentsV2] falha ao enviar painel:', err.message || err);
    }
    throw err;
  }
}

/** Prepara payload para channel.send / message.edit */
export function prepararMensagem(payload = {}, { forEdit = false } = {}) {
  return normalizarPainel(payload, { forEdit });
}

/**
 * Edita mensagem no canal com suporte a troca Embed ↔ V2
 * (se o modo mudar, apaga e reenvia).
 */
export async function editarOuRepostar(message, payload) {
  if (!message) return null;
  const next = prepararMensagem(payload, { forEdit: true });
  const nextV2 = isComponentsV2Payload(next);
  const msgFlags = Number(message.flags?.bitfield ?? message.flags ?? 0);
  const currentV2 = Boolean(msgFlags & FLAG_V2);

  if (currentV2 === nextV2) {
    try {
      return await message.edit(next);
    } catch (err) {
      console.error('[ComponentsV2] edit falhou, tentando repost:', err.message);
    }
  }

  // Troca de modo ou edit falhou → repost
  const channel = message.channel;
  await message.delete().catch(() => null);
  return channel.send(prepararMensagem(payload, { forEdit: false }));
}
