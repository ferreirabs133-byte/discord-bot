import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { renderCustomEmojis } from './emojis.js';
// Branding Flow — não remova (ver infraestrutura/creditos.js)
import { footerComCredito } from '../infraestrutura/creditos.js';

export function id(...parts) {
  return `zend:${parts.join(':')}`.slice(0, 100);
}

export function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function nowFooter(guild, label) {
  return { text: footerComCredito(guild?.name || 'Loja', label) };
}

export function embed(title, description, guild, label) {
  const builder = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(renderCustomEmojis(title))
    .setFooter(nowFooter(guild, label))
    .setTimestamp();
  if (description) builder.setDescription(renderCustomEmojis(description));
  return builder;
}

export function button(customId, label, style = ButtonStyle.Secondary, emoji, disabled = false) {
  const b = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style).setDisabled(disabled);
  if (emoji) b.setEmoji(emoji);
  return b;
}

export function linkButton(url, label, emoji) {
  const b = new ButtonBuilder().setURL(url).setLabel(label).setStyle(ButtonStyle.Link);
  if (emoji) b.setEmoji(emoji);
  return b;
}

export function rows(...components) {
  const out = [];
  for (let i = 0; i < components.length; i += 5) {
    out.push(new ActionRowBuilder().addComponents(...components.slice(i, i + 5)));
  }
  return out;
}

export function textInput(customId, label, placeholder, style = TextInputStyle.Short, required = true, value) {
  const input = new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setPlaceholder(placeholder || ' ')
    .setStyle(style)
    .setRequired(required);
  if (value !== undefined && value !== null && String(value).length) input.setValue(String(value).slice(0, 4000));
  return input;
}

export function modal(customId, title, inputs) {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(...inputs.map((input) => new ActionRowBuilder().addComponents(input)));
}
