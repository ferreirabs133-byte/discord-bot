/**
 * Mensagens de sistema no canal — visual igual ao print:
 * - Limpeza automática
 * - Canal trancado / destrancado
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

const COR_VERDE = 0x57f287;

function chip(label, style = ButtonStyle.Secondary, emoji, disabled = true) {
  const b = new ButtonBuilder()
    .setCustomId(`zend:sys-chip:${Math.random().toString(36).slice(2, 9)}`)
    .setLabel(label.slice(0, 80))
    .setStyle(style)
    .setDisabled(disabled);
  if (emoji) b.setEmoji(emoji);
  return b;
}

/** 🗑️ Total de N mensagens removidas. + botão "Limpeza automática" */
export function payloadLimpezaAutomatica(removidas) {
  const total = Number(removidas) || 0;
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(COR_VERDE)
        .setDescription(`🗑️ Total de **${total}** mensagens removidas.`),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        chip('Limpeza automática', ButtonStyle.Secondary, '🧹', true),
      ),
    ],
  };
}

/** 🔒 Canal trancado automaticamente */
export function payloadCanalTrancado() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(COR_VERDE)
        .setDescription('🔒 Este canal foi **trancado** automaticamente pelo sistema.'),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        chip('Mensagem do sistema', ButtonStyle.Secondary, null, true),
        new ButtonBuilder()
          .setCustomId(`zend:sys-chip-lock:${Math.random().toString(36).slice(2, 9)}`)
          .setLabel('Canal trancado')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
          .setDisabled(true),
      ),
    ],
  };
}

/** 🔓 Canal destrancado automaticamente (print) */
export function payloadCanalDestrancado() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(COR_VERDE)
        .setDescription('🔓 Este canal foi **destrancado** automaticamente pelo sistema.'),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        chip('Mensagem do sistema', ButtonStyle.Secondary, null, true),
        new ButtonBuilder()
          .setCustomId(`zend:sys-chip-unlock:${Math.random().toString(36).slice(2, 9)}`)
          .setLabel('Canal destrancado')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔒')
          .setDisabled(true),
      ),
    ],
  };
}

export async function enviarAvisoCanal(channel, payload) {
  if (!channel?.isTextBased?.()) return null;
  return channel.send(payload).catch(() => null);
}
