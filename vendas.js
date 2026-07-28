import { ActionRowBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import {
  CORES,
  componentesEntregaDm,
  embedEntregaDm,
  embedLogEntregaCanal,
  embedPedidoAprovado,
  embedPedidoSolicitado,
  payloadFeedback,
} from './embeds-cliente.js';
import { button, embed, id, linkButton, money } from '../discord/componentes.js';

export function criarLogsDeVendas(ctx) {
  const {
    ActionRowBuilder: AR,
    ButtonStyle: BS,
    EmbedBuilder: EB,
    EMOJI,
    button: btn,
    cartAmounts,
    cartField,
    cartItemName,
    cartProduct,
    embed: emb,
    id: mkId,
    linkButton: lbtn,
    money: moneyFn,
    parseHex,
    renderFeedback,
  } = ctx;

  // Prefer deps injetados; fallback aos imports locais
  const _button = btn || button;
  const _id = mkId || id;
  const _linkButton = lbtn || linkButton;
  const _money = moneyFn || money;
  const _embed = emb || embed;
  const _AR = AR || ActionRowBuilder;
  const _BS = BS || ButtonStyle;
  const _EB = EB || EmbedBuilder;

  async function sendConfiguredLog(guild, channelId, payload) {
    if (!channelId) return null;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return null;
    return channel.send(payload).catch(() => null);
  }

  function editStockButton(product, field) {
    return new _AR().addComponents(
      _button(
        _id('field-stock', product?.id || 'missing', field?.id || 'missing'),
        'Editar estoque',
        _BS.Primary,
        EMOJI.editStock,
      ),
    );
  }

  async function sendManualApprovalLog(guild, gs, cart, approverId) {
    if (cart.manualApprovalLogSent) return null;
    const product = cartProduct(gs, cart);
    const field = cartField(gs, cart);
    const total = cartAmounts(gs, cart).total;

    const sent = await sendConfiguredLog(guild, gs.channels.orderLogs, {
      embeds: [
        new _EB()
          .setColor(CORES.verde)
          .setAuthor({
            name: 'Pedido aprovado manualmente',
            iconURL: guild.iconURL?.({ size: 64 }) || undefined,
          })
          .setDescription(
            `Staff <@${approverId}> aprovou manualmente o pagamento do usuário <@${cart.userId}>.`,
          )
          .addFields(
            {
              name: 'Itens',
              value: `\`\`\`\n${cart.quantity}x ${cartItemName(product, field)}\n\`\`\``,
              inline: false,
            },
            { name: 'Total', value: `\`${_money(total)}\``, inline: true },
            {
              name: 'Forma de pagamento',
              value: '`Pix - Semiautomático`',
              inline: true,
            },
          )
          .setFooter({ text: guild?.name || 'Loja' })
          .setTimestamp(),
      ],
    });
    if (sent) cart.manualApprovalLogSent = true;
    return sent;
  }

  async function sendOrderRequestedLog(guild, gs, cart) {
    if (cart.requestLogSent) return null;
    const product = cartProduct(gs, cart);
    const field = cartField(gs, cart);
    const total = cartAmounts(gs, cart).total;

    // Log no canal (mesmo visual do DM do cliente)
    const sent = await sendConfiguredLog(guild, gs.channels.orderLogs, {
      embeds: [
        embedPedidoSolicitado({
          guild,
          product,
          field,
          quantity: cart.quantity,
          total,
          cartItemName,
          paymentLabel: cart.paymentMethod || 'Pix - Semiautomático',
        }),
      ],
    });

    // DM do cliente com o mesmo visual
    const member = await guild.members.fetch(cart.userId).catch(() => null);
    if (member) {
      await member
        .send({
          embeds: [
            embedPedidoSolicitado({
              guild,
              product,
              field,
              quantity: cart.quantity,
              total,
              cartItemName,
              paymentLabel: cart.paymentMethod || 'Pix - Semiautomático',
            }),
          ],
        })
        .catch(() => null);
    }

    if (sent) cart.requestLogSent = true;
    return sent;
  }

  async function sendBuyerDeliveryDm(member, guild, gs, cart, product, field, delivered) {
    if (!member) return null;

    const orderId = cart.orderId || `AM_${cart.id}`;
    const total = cart.total ?? cartAmounts(gs, cart).total;

    // 1) Pedido aprovado
    await member
      .send({
        embeds: [
          embedPedidoAprovado({
            guild,
            product,
            field,
            quantity: cart.quantity,
            total,
            cartItemName,
            paymentLabel: cart.paymentMethod
              ? `${cart.paymentMethod} - Aprovado`
              : 'Pix - Aprovado manualmente',
          }),
        ],
      })
      .catch(() => null);

    // Guarda entrega no cart (botão copiar)
    cart.deliveredItems = Array.isArray(delivered) ? [...delivered] : [String(delivered || '')];
    cart.orderId = orderId;

    // 2) Entrega realizada
    const deliveryEmbed = embedEntregaDm({
      guild,
      orderId,
      product,
      field,
      quantity: cart.quantity,
      total,
      delivered: cart.deliveredItems,
      cartItemName,
    });

    const components = componentesEntregaDm({ guild, cart, product, field });
    const fileName = `${orderId}.txt`.replace(/[^a-zA-Z0-9_.-]/g, '_');

    const deliveredMessage = await member
      .send({
        embeds: [deliveryEmbed],
        files: [
          {
            attachment: Buffer.from(cart.deliveredItems.join('\n'), 'utf8'),
            name: fileName,
          },
        ],
        components,
      })
      .catch(() => null);

    // 3) Feedback
    const fb = payloadFeedback({
      guild,
      user: member.user,
      gs,
      renderFeedback,
    });
    if (fb.content) {
      await member.send(fb).catch(() => null);
    }

    return deliveredMessage;
  }

  async function sendOutOfStockLog(guild, gs, product, field) {
    return sendConfiguredLog(guild, gs.channels.orderLogs, {
      content: '@everyone',
      embeds: [
        new _EB()
          .setColor(CORES.vermelho)
          .setAuthor({
            name: 'Alerta de estoque!',
            iconURL: guild.iconURL?.({ size: 64 }) || undefined,
          })
          .setDescription(
            `O estoque do produto **${cartItemName(product, field)}** acabou!`,
          )
          .addFields(
            { name: 'Produto', value: product?.name || 'Produto removido', inline: true },
            { name: 'Campo', value: field?.name || 'Campo removido', inline: true },
          )
          .setTimestamp(),
      ],
      components: [editStockButton(product, field)],
    });
  }

  async function sendDeliveryLog(guild, gs, cart) {
    if (cart.deliveryLogSent) return null;
    const product = cartProduct(gs, cart);
    const field = cartField(gs, cart);

    await sendConfiguredLog(guild, gs.channels.orderLogs, {
      embeds: [
        embedLogEntregaCanal({
          guild,
          cart,
          product,
          field,
          cartItemName,
          total: cartAmounts(gs, cart).total,
        }),
      ],
      components: [editStockButton(product, field)],
    });

    if (gs.customization.publicLog.enabled && gs.channels.publicPurchases) {
      const item = `${cart.quantity}x ${cartItemName(product, field)}`;
      const totalStr = _money(cartAmounts(gs, cart).total);
      const actions = [];
      if (gs.customization.publicLog.showBuy && product?.salesMessage) {
        actions.push(
          _linkButton(
            `https://discord.com/channels/${guild.id}/${product.salesMessage.channelId}/${product.salesMessage.messageId}`,
            'Comprar novamente',
            EMOJI.carrinhoZend,
          ),
        );
      }
      if (gs.customization.publicLog.showFeedback && gs.channels.feedback) {
        actions.push(
          _linkButton(
            `https://discord.com/channels/${guild.id}/${gs.channels.feedback}`,
            'Feedbacks',
            '🏆',
          ),
        );
      }

      // Container V2 (quando ativado nas customizações)
      if (gs.customization.publicLog.v2) {
        const {
          ContainerBuilder,
          TextDisplayBuilder,
          MediaGalleryBuilder,
          MediaGalleryItemBuilder,
          MessageFlags,
        } = await import('discord.js');

        const components = [];
        if (gs.customization.publicLog.image) {
          components.push(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL(gs.customization.publicLog.image),
            ),
          );
        }
        components.push(
          new ContainerBuilder()
            .setAccentColor(parseHex(gs.customization.colors.success) || CORES.verde)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                [
                  '### 🛍️ Entrega Realizada!',
                  `O usuário <@${cart.userId}> teve seu pedido entregue.`,
                  '',
                  `**Carrinho** · \`${item}\``,
                  `**Valor pago** · \`${totalStr}\``,
                ].join('\n'),
              ),
            ),
        );
        if (actions.length) {
          components.push(new _AR().addComponents(...actions));
        }

        await sendConfiguredLog(guild, gs.channels.publicPurchases, {
          flags: MessageFlags.IsComponentsV2,
          components,
        });
      } else {
        const publicEmbed = _embed(
          '🛍️ Entrega Realizada!',
          [
            `O usuário <@${cart.userId}> teve seu pedido entregue.`,
            '',
            '**Carrinho**',
            `\`${item}\``,
            '',
            '**Valor pago**',
            `\`${totalStr}\``,
          ].join('\n'),
          guild,
          'Log pública de entregas',
        ).setColor(parseHex(gs.customization.colors.success) || CORES.verde);

        if (gs.customization.publicLog.image) {
          publicEmbed.setImage(gs.customization.publicLog.image);
        }

        await sendConfiguredLog(guild, gs.channels.publicPurchases, {
          embeds: [publicEmbed],
          components: actions.length ? [new _AR().addComponents(...actions)] : [],
        });
      }
    }

    cart.deliveryLogSent = true;
    return true;
  }

  async function sendApprovalLog(guild, gs, cart) {
    if (cart.approvalLogSent && cart.logMessage) return null;
    const product = cartProduct(gs, cart);
    const field = cartField(gs, cart);

    const log = _embed(
      `${EMOJI.cartLoaded} Pedido aguardando aprovação`,
      [
        `**Carrinho:** \`${cart.publicId}\``,
        `**Cliente:** <@${cart.userId}>`,
        `**Produto:** \`${product?.name || 'Removido'} • ${field?.name || 'Removido'}\``,
        `**Quantidade:** \`${cart.quantity}x\``,
        `**Total:** \`${_money(cart.total)}\``,
        `**Pagamento:** \`${cart.paymentMethod || 'Manual'}\``,
        `**Comprovante:** ${cart.proof || '`Não informado`'}`,
      ].join('\n'),
      guild,
      'Logs de pedidos',
    ).setColor(CORES.amarelo);

    const sent = await sendConfiguredLog(guild, gs.channels.orderLogs, {
      embeds: [log],
      components: [
        new _AR().addComponents(
          _button(
            _id('cart-admin-approve', cart.id),
            'Confirmar pagamento',
            _BS.Success,
            EMOJI.check,
          ),
          _button(
            _id('cart-admin-decline', cart.id),
            'Recusar pagamento',
            _BS.Danger,
            EMOJI.no,
          ),
        ),
      ],
    });

    if (sent) {
      cart.logMessage = { channelId: sent.channelId, messageId: sent.id };
      cart.approvalLogSent = true;
    }
    return sent;
  }

  return {
    sendConfiguredLog,
    editStockButton,
    sendManualApprovalLog,
    sendOrderRequestedLog,
    sendBuyerDeliveryDm,
    sendOutOfStockLog,
    sendDeliveryLog,
    sendApprovalLog,
  };
}
