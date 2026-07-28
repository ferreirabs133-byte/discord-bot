/**
 * Embeds de DM / logs no visual moderno (dark + barra colorida).
 * Baseado nos prints: pedido, entrega, ticket e feedback.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { EMOJI } from '../discord/emojis.js';
import { button, id, linkButton, money } from '../discord/componentes.js';
// Branding Flow — footers de DM/log (ver infraestrutura/creditos.js)
import { CREDIT_FOOTER } from '../infraestrutura/creditos.js';

// Cores das barras laterais (prints)
export const CORES = {
  amarelo: 0xf0b232, // pedido solicitado / atualização ticket
  verde: 0x3ba55d, // aprovado / entrega
  vermelho: 0xe74c3c, // ticket encerrado
  roxo: 0x5865f2,
  escuro: 0x2b2d31,
};

function guildIcon(guild) {
  return guild?.iconURL?.({ size: 64 }) || undefined;
}

function footerSuporte(guild, label = 'Equipe de Suporte') {
  const name = guild?.name || 'Loja';
  return {
    text: `${label} - ${name} · ${CREDIT_FOOTER}`.slice(0, 2048),
    iconURL: guildIcon(guild),
  };
}

function footerLoja(guild) {
  return {
    text: `${guild?.name || 'Loja'} · ${CREDIT_FOOTER}`.slice(0, 2048),
    iconURL: guildIcon(guild),
  };
}

function itemLinha(quantity, product, field, cartItemName) {
  const nome = cartItemName
    ? cartItemName(product, field)
    : [product?.name, field?.name].filter(Boolean).join(' - ') || 'Produto';
  // Visual do print: "1x Impulsos - 14x Impulsos"
  if (product?.name && field?.name && product.name !== field.name) {
    return `${quantity}x ${product.name} - ${field.name}`;
  }
  return `${quantity}x ${nome}`;
}

function tsRelativo(ms = Date.now()) {
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

function tsCompleto(ms = Date.now()) {
  return `<t:${Math.floor(ms / 1000)}:f>`;
}

/** Pedido solicitado (barra amarela) */
export function embedPedidoSolicitado({ guild, product, field, quantity, total, cartItemName, paymentLabel = 'Pix - Semiautomático' }) {
  const item = itemLinha(quantity, product, field, cartItemName);
  return new EmbedBuilder()
    .setColor(CORES.amarelo)
    .setAuthor({ name: 'Pedido solicitado', iconURL: guildIcon(guild) })
    .setDescription('Seu pedido foi criado e agora está aguardando a confirmação do pagamento')
    .addFields(
      { name: 'Itens', value: `\`\`\`\n${item}\n\`\`\``, inline: false },
      { name: 'Total', value: `\`${money(total)}\``, inline: true },
      { name: 'Forma de Pagamento', value: `\`${paymentLabel}\``, inline: true },
    )
    .setFooter(footerLoja(guild))
    .setTimestamp();
}

/** Pedido aprovado (barra verde) */
export function embedPedidoAprovado({ guild, product, field, quantity, total, cartItemName, paymentLabel = 'Pix - Aprovado manualmente' }) {
  const item = itemLinha(quantity, product, field, cartItemName);
  return new EmbedBuilder()
    .setColor(CORES.verde)
    .setAuthor({ name: 'Pedido aprovado', iconURL: guildIcon(guild) })
    .setDescription('Seu pagamento foi confirmado e o seu pedido foi aprovado...')
    .addFields(
      { name: 'Itens', value: `\`\`\`\n${item}\n\`\`\``, inline: false },
      { name: 'Total', value: `\`${money(total)}\``, inline: true },
      { name: 'Forma de Pagamento', value: `\`${paymentLabel}\``, inline: true },
    )
    .setFooter(footerLoja(guild))
    .setTimestamp();
}

/** Entrega na DM (barra verde) + botões */
export function embedEntregaDm({
  guild,
  orderId,
  product,
  field,
  quantity,
  total,
  delivered = [],
  cartItemName,
}) {
  const item = itemLinha(quantity, product, field, cartItemName);
  const produtoTexto = delivered.length
    ? delivered.map((x) => String(x)).join('\n').slice(0, 1000)
    : '`Sem conteúdo`';

  const embed = new EmbedBuilder()
    .setColor(CORES.verde)
    .setAuthor({ name: `Pedido #${orderId}`, iconURL: guildIcon(guild) })
    .setTitle('Entrega Realizada')
    .setDescription('Seu produto foi anexado a essa mensagem')
    .addFields(
      { name: 'Carrinho', value: `\`${item}\``, inline: false },
      { name: 'Valor pago', value: `\`${money(total)}\``, inline: false },
      { name: '➜ SEU PRODUTO ABAIXO!', value: produtoTexto, inline: false },
    )
    .setFooter(footerLoja(guild))
    .setTimestamp();

  return embed;
}

export function componentesEntregaDm({ guild, cart, product, field }) {
  const rows = [];

  // Linha 1: copiar produto
  rows.push(
    new ActionRowBuilder().addComponents(
      button(
        id('delivery-copy', cart.id),
        'Copiar produto entregue',
        ButtonStyle.Primary,
        EMOJI.copiaCola || '📋',
      ),
    ),
  );

  // Linha 2: restock notify
  rows.push(
    new ActionRowBuilder().addComponents(
      button(
        id('delivery-restock', product?.id || 'x', field?.id || 'x'),
        'Avisar atualizações de estoque',
        ButtonStyle.Secondary,
        '🔔',
      ),
    ),
  );

  // Linha 3: comprar novamente (link se houver)
  const sale = product?.salesMessage;
  if (sale?.channelId && sale?.messageId && guild?.id) {
    rows.push(
      new ActionRowBuilder().addComponents(
        linkButton(
          `https://discord.com/channels/${guild.id}/${sale.channelId}/${sale.messageId}`,
          'Comprar novamente',
          '💲',
        ),
      ),
    );
  }

  return rows;
}

/** Feedback pós-compra (mensagem simples + botão) */
export function payloadFeedback({ guild, user, gs, renderFeedback }) {
  const feedback = gs.customization?.feedbackDm || {};
  const template =
    feedback.message ||
    '{saudacao} {usuario}. Se você curtiu sua compra, **que tal deixar uma avaliação**? Isso nos motiva, ajuda quem está em dúvida e ainda contribui para que a gente continue oferecendo serviços cada vez melhores pra você! 😊.';

  const content = renderFeedback
    ? renderFeedback(template, user)
    : template.replaceAll('{usuario}', `<@${user.id}>`);

  const components = [];
  if (gs.channels?.feedback && guild?.id) {
    components.push(
      new ActionRowBuilder().addComponents(
        linkButton(
          `https://discord.com/channels/${guild.id}/${gs.channels.feedback}`,
          feedback.buttonText || 'Clique aqui e deixe seu feedback ;)',
        ),
      ),
    );
  }

  return { content, components };
}

/** Atualização de ticket (barra amarela) */
export function embedTicketAtualizacao({ guild, ticket, channel }) {
  const ticketLabel = channel?.name
    ? `#${channel.name}`
    : ticket?.functionName
      ? `#-${ticket.functionName}`
      : `#ticket-${ticket?.id || '?'}`;

  return new EmbedBuilder()
    .setColor(CORES.amarelo)
    .setAuthor({
      name: 'Atualização no Ticket',
      iconURL: guildIcon(guild),
    })
    .setDescription('Olá! Temos novidades sobre o seu ticket. Estamos aguardando sua resposta.')
    .addFields(
      { name: 'Status', value: 'Aguardando sua resposta...', inline: true },
      { name: 'Ticket', value: `\`${ticketLabel}\``, inline: true },
      {
        name: 'Última Atualização',
        value: tsRelativo(ticket?.updatedAt || Date.now()),
        inline: false,
      },
    )
    .setFooter(footerSuporte(guild))
    .setTimestamp();
}

export function componentesTicketAtualizacao({ guild, channel }) {
  if (!guild?.id || !channel?.id) return [];
  return [
    new ActionRowBuilder().addComponents(
      linkButton(
        `https://discord.com/channels/${guild.id}/${channel.id}`,
        'Ir para o Ticket',
      ),
    ),
  ];
}

/** Ticket encerrado (barra vermelha) — visual do print */
export function embedTicketEncerrado({ guild, ticket, closedByUser, member }) {
  const closedByName =
    closedByUser?.username ||
    closedByUser?.globalName ||
    (ticket?.closedBy ? `<@${ticket.closedBy}>` : 'Equipe');

  return new EmbedBuilder()
    .setColor(CORES.vermelho)
    .setAuthor({
      name: 'Seu Ticket foi Encerrado',
      iconURL: guildIcon(guild),
    })
    .setDescription(
      `Olá ${member ? `<@${member.id}>` : 'cliente'}! Seu ticket foi encerrado e aqui está o resumo:`,
    )
    .addFields(
      {
        name: '📁 Categoria',
        value: `\`${ticket?.functionName || 'Suporte'}\``,
        inline: true,
      },
      {
        name: '👤 Fechado por',
        value: `\`${closedByName}\``,
        inline: true,
      },
      {
        name: '🕐 Encerrado',
        value: tsRelativo(ticket?.closedAt || Date.now()),
        inline: false,
      },
    )
    .setFooter(footerSuporte(guild))
    .setTimestamp(ticket?.closedAt || Date.now());
}

/**
 * Sempre retorna os 2 botões do print:
 * - Ver Transcript
 * - Abrir Ticket Novamente
 *
 * Prefere botões de link quando há URL; senão usa botões interativos (sempre visíveis).
 */
export function componentesTicketEncerrado({ guild, gs, ticket, transcriptUrl } = {}) {
  const row = new ActionRowBuilder();

  // 1) Ver Transcript
  const tUrl = transcriptUrl || ticket?.transcriptUrl;
  if (tUrl && /^https?:\/\//i.test(tUrl)) {
    row.addComponents(linkButton(tUrl, 'Ver Transcript', '📄'));
  } else {
    row.addComponents(
      button(
        id('ticket-transcript', ticket?.id || 'x'),
        'Ver Transcript',
        ButtonStyle.Secondary,
        '📄',
      ),
    );
  }

  // 2) Abrir Ticket Novamente
  const reopenUrl = urlReabrirTicket(guild, gs);
  if (reopenUrl) {
    row.addComponents(linkButton(reopenUrl, 'Abrir Ticket Novamente', '🎫'));
  } else {
    row.addComponents(
      button(
        id('ticket-reopen', ticket?.functionId || ticket?.functionName || 'support'),
        'Abrir Ticket Novamente',
        ButtonStyle.Primary,
        '🎫',
      ),
    );
  }

  return [row];
}

/** URL do painel de tickets postado no servidor (se existir) */
export function urlReabrirTicket(guild, gs) {
  if (!guild?.id) return null;
  const posted = gs?.ticket?.postedMessages?.[0];
  if (posted?.channelId && posted?.messageId) {
    return `https://discord.com/channels/${guild.id}/${posted.channelId}/${posted.messageId}`;
  }
  const ch = gs?.channels?.tickets || gs?.channels?.notify;
  if (ch) return `https://discord.com/channels/${guild.id}/${ch}`;
  return null;
}

/** Gera texto de transcript a partir das mensagens do canal */
export async function montarTranscript(channel, ticket = {}) {
  if (!channel?.messages?.fetch) {
    return [
      `Transcript do ticket ${ticket.id || ''}`,
      `Categoria: ${ticket.functionName || 'Suporte'}`,
      `Usuário: ${ticket.userId || '?'}`,
      `Encerrado: ${new Date(ticket.closedAt || Date.now()).toISOString()}`,
      '',
      '(Sem mensagens capturadas)',
    ].join('\n');
  }

  const collected = [];
  let lastId;
  // até ~200 msgs (4 páginas)
  for (let i = 0; i < 4; i += 1) {
    const batch = await channel.messages
      .fetch({ limit: 50, ...(lastId ? { before: lastId } : {}) })
      .catch(() => null);
    if (!batch?.size) break;
    const arr = [...batch.values()];
    collected.push(...arr);
    lastId = arr[arr.length - 1]?.id;
    if (batch.size < 50) break;
  }

  collected.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const lines = [
    '══════════════════════════════════',
    ` TRANSCRIPT · ${ticket.functionName || 'Ticket'}`,
    ` ID: ${ticket.id || '—'}`,
    ` Usuário: ${ticket.userId || '—'}`,
    ` Fechado: ${new Date(ticket.closedAt || Date.now()).toLocaleString('pt-BR')}`,
    '══════════════════════════════════',
    '',
  ];

  for (const msg of collected) {
    const when = new Date(msg.createdTimestamp).toLocaleString('pt-BR');
    const author = msg.author?.tag || msg.author?.username || 'Desconhecido';
    const body = msg.cleanContent || msg.content || '';
    const attach =
      msg.attachments?.size > 0
        ? `\n  [anexos: ${[...msg.attachments.values()].map((f) => f.url).join(', ')}]`
        : '';
    if (!body && !attach) continue;
    lines.push(`[${when}] ${author}:`);
    if (body) lines.push(body);
    if (attach) lines.push(attach.trim());
    lines.push('');
  }

  if (collected.length === 0) {
    lines.push('(Nenhuma mensagem no canal)');
  }

  return lines.join('\n').slice(0, 180_000);
}

/** Log interno: entrega no canal de pedidos */
export function embedLogEntregaCanal({ guild, cart, product, field, cartItemName, total }) {
  const orderId = cart.orderId || `AM_${cart.id}`;
  const valor = total ?? cart.total ?? 0;
  const item = itemLinha(cart.quantity, product, field, cartItemName);

  return new EmbedBuilder()
    .setColor(CORES.verde)
    .setAuthor({ name: 'Entrega realizada!', iconURL: guildIcon(guild) })
    .setDescription(`Usuário <@!${cart.userId}> teve seu pedido entregue.`)
    .addFields(
      { name: 'Detalhes', value: `\`${item} | ${money(valor)}\``, inline: false },
      { name: 'ID do Pedido', value: `\`${orderId}\``, inline: false },
    )
    .setFooter(footerLoja(guild))
    .setTimestamp();
}
