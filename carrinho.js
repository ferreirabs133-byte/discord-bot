export function criarSistemaCarrinho(ctx) {
  const {
    ActionRowBuilder,
    ButtonStyle,
    ChannelType,
    ContainerBuilder,
    EMOJI,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SeparatorBuilder,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
    TextInputStyle,
    balanceUser,
    button,
    embed,
    guildState,
    id,
    linkButton,
    modal,
    money,
    nowFooter,
    salePayload,
    sendApprovalLog,
    sendBuyerDeliveryDm,
    sendConfiguredLog,
    sendDeliveryLog,
    sendManualApprovalLog,
    sendOrderRequestedLog,
    sendOutOfStockLog,
    stockCount,
    textInput,
  } = ctx;

const CART_TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'EXPIRED', 'DECLINED']);
const CART_EDITABLE_STATUSES = new Set(['OPEN', 'PAYMENT_SELECTION']);

function cartPublicId(gs) {
  gs.cartSequence = Number(gs.cartSequence || 0) + 1;
  return `ZEND-${String(gs.cartSequence).padStart(5, '0')}`;
}

function getCart(gs, query) {
  if (!query) return null;
  const clean = String(query).trim().toUpperCase();
  return gs.carts.find((cart) => cart.id === query || cart.publicId?.toUpperCase() === clean || cart.channelId === query) || null;
}

function cartProduct(gs, cart) {
  return gs.products.find((product) => product.id === cart.productId) || null;
}

function cartField(gs, cart) {
  return cartProduct(gs, cart)?.fields?.find((field) => field.id === cart.fieldId) || null;
}

function availableStock(field) {
  if (!field) return 0;
  if (field.infinite?.enabled) return Number.POSITIVE_INFINITY;
  return stockCount(field);
}

function clampCartQuantity(cart, field) {
  const min = Math.max(1, Number(field?.minQty || 1));
  const configuredMax = Math.max(min, Number(field?.maxQty || 99));
  const stock = availableStock(field);
  const max = Number.isFinite(stock) ? Math.max(0, Math.min(configuredMax, stock)) : configuredMax;
  cart.quantity = Math.max(min, Math.min(Number(cart.quantity || min), max || min));
  return { min, max };
}

function findCartCoupon(product, code) {
  if (!code) return null;
  return (product?.coupons || []).find((coupon) => String(coupon.code).toUpperCase() === String(code).trim().toUpperCase()) || null;
}

function cartAmounts(gs, cart) {
  const product = cartProduct(gs, cart);
  const field = cartField(gs, cart);
  const subtotal = Math.round(Number(field?.price || 0) * Number(cart.quantity || 1) * 100) / 100;
  const coupon = findCartCoupon(product, cart.couponCode);
  const discountPercent = coupon ? Math.max(0, Math.min(100, Number(coupon.discount || 0))) : 0;
  const discount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  Object.assign(cart, { subtotal, discountPercent, discount, total });
  return { subtotal, discountPercent, discount, total, coupon };
}

function cartStatusLabel(status) {
  return ({
    OPEN: 'Montando carrinho',
    PAYMENT_SELECTION: 'Escolhendo pagamento',
    AWAITING_MANUAL_PAYMENT: 'Aguardando comprovante',
    AWAITING_APPROVAL: 'Aguardando aprovação',
    PROCESSING: 'Processando entrega',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
    DECLINED: 'Pagamento recusado',
  })[status] || status;
}

function cartBuyerName(cart) {
  return (cart.userName || cart.userTag || cart.publicId || 'cliente').split('#')[0].replace(/[^\w.-]/g, '').slice(0, 32) || 'cliente';
}

function cartThreadName(cart, marker = 'cart') {
  const icon = marker === 'paid' ? '➕' : marker === 'delivered' ? '✅' : marker === 'cancelled' ? '❌' : '🛒';
  return `${icon}・${cartBuyerName(cart)}・${cart.userId}`;
}

function cartItemName(product, field) {
  return `${product?.name || 'Produto removido'} - ${field?.name || 'Campo removido'}`;
}

function cartItemsText(gs, cart, payment = false) {
  const product = cartProduct(gs, cart);
  const field = cartField(gs, cart);
  if (payment) return `- ${cart.quantity}x **${field?.name || product?.name || 'Produto'}**`;
  const amounts = cartAmounts(gs, cart);
  const stock = availableStock(field);
  return [
    `${EMOJI.seta} **(${cart.quantity}x)** ${product?.name || 'Produto removido'} - **\`${field?.name || 'Campo removido'}\`**`,
    `-# \`${money(field?.price || 0)}\` por unidade · subtotal **\`${money(amounts.subtotal)}\`** · **estoque ${Number.isFinite(stock) ? stock : '∞'}**`,
  ].join('\n');
}

function cartSummaryContainer(gs, cart) {
  const amounts = cartAmounts(gs, cart);
  const couponLine = cart.couponCode
    ? `\n${EMOJI.ticketZend} **Cupom** — \`${cart.couponCode}\` (${cart.discountPercent}% OFF)`
    : '';
  return new ContainerBuilder()
    .setAccentColor(0xffffff)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Revisão do Pedido — ${cartBuyerName(cart)}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(cartItemsText(gs, cart)))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `${EMOJI.zendCart} **Total de itens** — \`${cart.quantity}\``,
      `${EMOJI.zendPay} **Total à vista** — \`${money(amounts.total)}\`${couponLine}`,
    ].join('\n')));
}

function paymentSummaryContainer(gs, cart) {
  const amounts = cartAmounts(gs, cart);
  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${EMOJI.zendCart} Forma de Pagamento\n-# ${EMOJI.seta} Selecione abaixo como deseja pagar.`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Itens:** \`${cart.quantity}\`  ·  **Total:** \`${money(amounts.total)}\``))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Itens no carrinho\n${cartItemsText(gs, cart, true)}`));
}

function hasConfiguredPayment(gs) {
  return Object.values(gs.payments || {}).some((method) => method?.enabled && method?.configured);
}

function pixCopyPasteCode(gs, cart) {
  const manual = gs.payments.manual;
  const key = String(manual.pixKey || 'suachavepix@gmail.com').trim();
  const amount = Number(cartAmounts(gs, cart).total || 0).toFixed(2);
  const keyLength = String(key.length).padStart(2, '0');
  const amountLength = String(amount.length).padStart(2, '0');
  return `00020126${String(22 + key.length).padStart(2, '0')}0014BR.GOV.BCB.PIX01${keyLength}${key}52040000530398654${amountLength}${amount}5802BR5909RECEBEDOR6008BRASILIA61082836000062070503***6304EBA7`;
}

function cartEmbed(guild, gs, cart) {
  const product = cartProduct(gs, cart);
  const field = cartField(gs, cart);
  const amounts = cartAmounts(gs, cart);
  const stock = availableStock(field);
  const color = cart.status === 'DELIVERED'
    ? 0x22c55e
    : ['CANCELLED', 'EXPIRED', 'DECLINED'].includes(cart.status)
      ? 0xef4444
      : 0x2b2d31;
  const e = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${EMOJI.cartLoaded} Carrinho • ${cart.publicId}`)
    .setDescription([
      `Olá, <@${cart.userId}>! Confira os dados do seu pedido abaixo.`,
      '',
      `**Produto:** \`${product?.name || 'Produto removido'}\``,
      `**Variação:** \`${field?.name || 'Não selecionada'}\``,
      `**Quantidade:** \`${cart.quantity || 1}x\``,
      `**Estoque disponível:** \`${Number.isFinite(stock) ? stock : '∞'}\``,
      cart.couponCode ? `**Cupom:** \`${cart.couponCode}\` (${amounts.discountPercent}% OFF)` : '**Cupom:** `Nenhum`',
      '',
      `**Subtotal:** \`${money(amounts.subtotal)}\``,
      `**Desconto:** \`- ${money(amounts.discount)}\``,
      `**Total:** \`${money(amounts.total)}\``,
      '',
      `**Status:** \`${cartStatusLabel(cart.status)}\``,
      `**Expira:** <t:${Math.floor(cart.expiresAt / 1000)}:R>`,
    ].join('\n'))
    .setFooter(nowFooter(guild, 'Carrinho Zend'))
    .setTimestamp();
  if (product?.icon) e.setThumbnail(product.icon);
  if (product?.banner) e.setImage(product.banner);
  return e;
}

function cartComponents(gs, cart) {
  const product = cartProduct(gs, cart);
  const field = cartField(gs, cart);
  const editable = CART_EDITABLE_STATUSES.has(cart.status);
  const components = [];
  if ((product?.fields?.length || 0) > 1) {
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(id('cart-field', cart.id))
          .setPlaceholder('Selecione uma variação')
          .setDisabled(!editable)
          .addOptions(product.fields.slice(0, 25).map((item) => ({
            label: item.name.slice(0, 100),
            description: `${money(item.price)} • Estoque: ${Number.isFinite(availableStock(item)) ? availableStock(item) : '∞'}`.slice(0, 100),
            value: item.id,
            default: item.id === cart.fieldId,
          }))),
      ),
    );
  }
  components.push(
    new ActionRowBuilder().addComponents(
      button(id('cart-checkout', cart.id), 'Ir para o Pagamento', ButtonStyle.Success, EMOJI.aceitar, !editable || !field || availableStock(field) < cart.quantity),
      button(id('cart-quantity', cart.id), 'Editar Quantidade', ButtonStyle.Primary, EMOJI.edit, !editable),
    ),
    new ActionRowBuilder().addComponents(
      button(id('cart-coupon', cart.id), 'Usar Cupom', ButtonStyle.Secondary, EMOJI.ticketZend, !editable),
      button(id('cart-cancel', cart.id), 'Cancelar', ButtonStyle.Danger, EMOJI.deleteZend, CART_TERMINAL_STATUSES.has(cart.status)),
    ),
  );
  return components;
}

function cartPayload(guild, gs, cart) {
  // Payload V2 puro — sem content/embeds
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [
      new TextDisplayBuilder().setContent(`### Carrinho · <@${cart.userId}>`),
      cartSummaryContainer(gs, cart),
      ...cartComponents(gs, cart),
    ],
  };
}

function paymentPayload(guild, gs, cart) {
  const pixEnabled = hasConfiguredPayment(gs);
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [
      paymentSummaryContainer(gs, cart),
      new ActionRowBuilder().addComponents(
        button(id('cart-pay-manual', cart.id), 'Pix', ButtonStyle.Secondary, EMOJI.pixZend, !pixEnabled),
        button(id('cart-pay-litecoin', cart.id), 'Litecoin', ButtonStyle.Secondary, EMOJI.litecoinZend, true),
      ),
      new ActionRowBuilder().addComponents(
        button(id('cart-pay-card', cart.id), 'Cartão de Crédito/Débito', ButtonStyle.Secondary, EMOJI.cardZend, true),
      ),
      new ActionRowBuilder().addComponents(
        button(id('cart-edit', cart.id), 'Voltar', ButtonStyle.Secondary, EMOJI.arrowZend),
      ),
    ],
  };
}

function manualPaymentPayload(guild, gs, cart) {
  return {
    content: `${EMOJI.warning} [Celular] Segure no código acima e aperte em copiar texto.`,
    components: [
      new ActionRowBuilder().addComponents(
        button(id('cart-confirm-payment', cart.id), 'Confirmar pagamento', ButtonStyle.Success),
        button(id('cart-cancel', cart.id), 'Cancelar', ButtonStyle.Danger),
      ),
    ],
  };
}

function isCartOwner(interaction, cart) {
  return interaction.user.id === cart.userId;
}

function isCartAdmin(interaction, gs) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  const roleIds = interaction.member?.roles?.cache;
  return Boolean(roleIds && [gs.roles?.staff, gs.roles?.manager].filter(Boolean).some((roleId) => roleIds.has(roleId)));
}

async function createCartChannel(interaction, gs, cart) {
  if (interaction.channel?.threads?.create) {
    const thread = await interaction.channel.threads.create({
      name: cartThreadName(cart),
      type: ChannelType.PrivateThread,
      invitable: false,
      autoArchiveDuration: 60,
      reason: `Carrinho Zend ${cart.publicId}`,
    }).catch(() => null);
    if (thread) {
      await thread.members.add(cart.userId).catch(() => null);
      return thread;
    }
  }

  const botId = interaction.client.user.id;
  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: cart.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    { id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
  ];
  for (const roleId of [gs.roles?.staff, gs.roles?.manager].filter(Boolean)) {
    overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }
  return interaction.guild.channels.create({
    name: `carrinho-${cartBuyerName(cart)}-${cart.userId}`.toLowerCase(),
    type: ChannelType.GuildText,
    topic: `Carrinho ${cart.publicId} • Cliente ${cart.userId}`,
    permissionOverwrites: overwrites,
    reason: `Carrinho Zend ${cart.publicId}`,
  }).catch(() => null);
}

async function refreshCartMessage(guild, gs, cart, payload = cartPayload(guild, gs, cart)) {
  if (!cart.channelId || !cart.messageId) return false;
  const channel = await guild.channels.fetch(cart.channelId).catch(() => null);
  if (!channel?.isTextBased()) return false;
  const message = await channel.messages.fetch(cart.messageId).catch(() => null);
  if (!message) return false;

  const { editarOuRepostar } = await import('../infraestrutura/resposta-painel.js');
  const updated = await editarOuRepostar(message, payload).catch((err) => {
    console.error('[carrinho] refresh V2:', err.message);
    return null;
  });
  if (updated?.id) cart.messageId = updated.id;
  return Boolean(updated);
}

async function syncSaleMessage(guild, product) {
  if (!product?.salesMessage) return;
  const channel = await guild.channels.fetch(product.salesMessage.channelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const message = await channel.messages.fetch(product.salesMessage.messageId).catch(() => null);
  if (!message) return;

  const gs = guildState(guild.id);
  const payload = salePayload(product, gs);
  const { editarOuRepostar } = await import('../infraestrutura/resposta-painel.js');
  const updated = await editarOuRepostar(message, payload).catch((err) => {
    console.error('[venda] sync V2:', err.message);
    return null;
  });
  if (updated?.id && updated.id !== product.salesMessage.messageId) {
    product.salesMessage.messageId = updated.id;
    product.salesMessage.channelId = updated.channelId || channel.id;
  }
}

function takeDelivery(field, quantity) {
  if (field.infinite?.enabled) return Array.from({ length: quantity }, () => field.infinite.text || 'Produto com estoque infinito');
  if (stockCount(field) < quantity) throw new Error('Estoque insuficiente para concluir a entrega.');
  const delivered = [];
  while (delivered.length < quantity && field.stock.length) delivered.push(field.stock.shift());
  while (delivered.length < quantity && Number(field.ghostStock?.quantity || 0) > 0) {
    delivered.push(field.ghostStock.value || 'Item de estoque fantasma');
    field.ghostStock.quantity -= 1;
  }
  return delivered;
}

async function deliverCart(interaction, gs, cart, approverId) {
  if (cart.status === 'DELIVERED') return { ok: false, message: `O carrinho \`${cart.publicId}\` já foi entregue.` };
  if (CART_TERMINAL_STATUSES.has(cart.status)) return { ok: false, message: `O carrinho \`${cart.publicId}\` está ${cartStatusLabel(cart.status).toLowerCase()}.` };
  if (cart.processing) return { ok: false, message: `O carrinho \`${cart.publicId}\` já está sendo processado.` };
  const product = cartProduct(gs, cart);
  const field = cartField(gs, cart);
  if (!product || !field) return { ok: false, message: 'O produto ou a variação deste carrinho não existe mais.' };
  if (availableStock(field) < cart.quantity) return { ok: false, message: 'Não há estoque suficiente para aprovar este carrinho.' };
  cart.processing = true;
  cart.status = 'PROCESSING';
  try {
    const delivered = takeDelivery(field, cart.quantity);
    const at = Date.now();
    cart.orderId ||= `AM_${crypto.randomUUID()}`;
    cart.status = 'DELIVERED';
    cart.approvedAt = at;
    cart.deliveredAt = at;
    cart.approvedBy = approverId;
    cart.delivery = delivered;
    cart.processing = false;
    const coupon = findCartCoupon(product, cart.couponCode);
    if (coupon) coupon.uses = Number(coupon.uses || 0) + 1;
    const purchase = {
      id: crypto.randomUUID(),
      cartId: cart.id,
      publicId: cart.publicId,
      userId: cart.userId,
      productId: product.id,
      fieldId: field.id,
      product: `${product.name} • ${field.name}`,
      quantity: cart.quantity,
      subtotal: cart.subtotal,
      discount: cart.discount,
      amount: cart.total,
      couponCode: cart.couponCode || null,
      paymentMethod: cart.paymentMethod,
      at,
      status: 'DELIVERED',
    };
    gs.purchases.push(purchase);
    gs.stats.salesToday = Number(gs.stats.salesToday || 0) + cart.total;
    gs.stats.salesTotal = Number(gs.stats.salesTotal || 0) + cart.total;
    gs.stats.countToday = Number(gs.stats.countToday || 0) + 1;
    gs.stats.countTotal = Number(gs.stats.countTotal || 0) + 1;
    const userLike = { id: cart.userId, tag: cart.userTag, username: cart.userTag };
    const account = balanceUser(gs, userLike);
    account.spent = Number(account.spent || 0) + cart.total;

    const member = await interaction.guild.members.fetch(cart.userId).catch(() => null);
    if (member) {
      if (field.addRole) await member.roles.add(field.addRole, `Compra ${cart.publicId}`).catch(() => null);
      if (field.removeRole) await member.roles.remove(field.removeRole, `Compra ${cart.publicId}`).catch(() => null);
      if (gs.roles?.client) await member.roles.add(gs.roles.client, `Cliente ${cart.publicId}`).catch(() => null);
    }

    await sendManualApprovalLog(interaction.guild, gs, cart, approverId);

    const dmMessage = await sendBuyerDeliveryDm(member, interaction.guild, gs, cart, product, field, delivered);
    const cartChannel = cart.channelId ? await interaction.guild.channels.fetch(cart.channelId).catch(() => null) : null;
    if (cartChannel?.setName) await cartChannel.setName(cartThreadName(cart, 'delivered')).catch(() => null);
    if (cartChannel?.isTextBased()) {
      const deleteAt = Math.floor((Date.now() + 2 * 60 * 1000) / 1000);
      const row = dmMessage
        ? [new ActionRowBuilder().addComponents(linkButton(`https://discord.com/channels/@me/${dmMessage.channelId}/${dmMessage.id}`, 'Ir para o pedido entregue'))]
        : [];
      await cartChannel.send({
        content: `${EMOJI.entregaSucess} **Entrega realizada!** Verifique seu privado, esse carrinho será excluído <t:${deleteAt}:R>`,
        components: row,
      }).catch(() => null);
      const exclusion = setTimeout(() => cartChannel.delete(`Carrinho ${cart.publicId} entregue`).catch(() => null), 2 * 60 * 1000);
      exclusion.unref?.();
    }

    await refreshCartMessage(interaction.guild, gs, cart);
    await syncSaleMessage(interaction.guild, product);
    if (availableStock(field) <= 0) await sendOutOfStockLog(interaction.guild, gs, product, field);
    await sendDeliveryLog(interaction.guild, gs, cart);
    return { ok: true, message: `Carrinho \`${cart.publicId}\` aprovado e entregue com sucesso.` };
  } catch (error) {
    cart.processing = false;
    cart.status = 'AWAITING_APPROVAL';
    return { ok: false, message: `Falha ao entregar o carrinho: ${error.message}` };
  }
}

async function cancelCart(guild, gs, cart, status = 'CANCELLED', reason = 'Cancelado pelo usuário') {
  if (cart.status === 'DELIVERED') return false;
  if (CART_TERMINAL_STATUSES.has(cart.status)) return false;
  cart.status = status;
  cart.cancelReason = reason;
  cart.closedAt = Date.now();
  await refreshCartMessage(guild, gs, cart);
  await sendConfiguredLog(guild, gs.channels.orderLogs, {
    embeds: [embed(`Carrinho ${cartStatusLabel(status).toLowerCase()}`, `**Carrinho:** \`${cart.publicId}\`\n**Cliente:** <@${cart.userId}>\n**Motivo:** ${reason}`, guild, 'Logs de pedidos').setColor(0xef4444)],
  });
  return true;
}

async function startCart(interaction, gs, product) {
  if (!gs.channels.orderLogs) {
    return interaction.reply({ content: `${EMOJI.no} Ops... o canal de logs pedidos ainda não foi configurado, faça um retorno em breve!`, ephemeral: true });
  }
  if (!hasConfiguredPayment(gs)) {
    return interaction.reply({ content: `${EMOJI.no} Ops... a forma de pagamento não foi configurada ainda, faça um retorno em breve!`, ephemeral: true });
  }
  const firstAvailable = product?.fields?.find((item) => availableStock(item) > 0);
  if (!product || !firstAvailable) {
    return interaction.reply({ content: `${EMOJI.no} Ops... este produto está sem estoque no momento.`, ephemeral: true });
  }
  if (firstAvailable.requiredRole && !interaction.member?.roles?.cache?.has(firstAvailable.requiredRole)) {
    return interaction.reply({ content: `${EMOJI.no} Você precisa do cargo <@&${firstAvailable.requiredRole}> para comprar esta variação.`, ephemeral: true });
  }
  const existing = [...gs.carts].reverse().find((item) => item.userId === interaction.user.id && item.productId === product.id && !CART_TERMINAL_STATUSES.has(item.status));
  if (existing) {
    const link = existing.channelId ? `https://discord.com/channels/${interaction.guild.id}/${existing.channelId}` : null;
    return interaction.reply({
      content: `Você já possui o carrinho \`${existing.publicId}\` aberto para este produto.`,
      components: link ? [new ActionRowBuilder().addComponents(linkButton(link, 'Ir para o carrinho', EMOJI.cartLoaded))] : [],
      ephemeral: true,
    });
  }
  const createdAt = Date.now();
  const cart = {
    id: crypto.randomUUID(),
    publicId: cartPublicId(gs),
    userId: interaction.user.id,
    userTag: interaction.user.tag || interaction.user.username,
    userName: interaction.user.username,
    userAvatar: interaction.user.displayAvatarURL({ extension: 'webp', size: 128 }),
    productId: product.id,
    fieldId: firstAvailable.id,
    quantity: Math.max(1, Number(firstAvailable.minQty || 1)),
    couponCode: null,
    paymentMethod: null,
    status: 'OPEN',
    createdAt,
    updatedAt: createdAt,
    expiresAt: createdAt + Math.max(5, Number(gs.cartSettings?.expirationMinutes || 30)) * 60_000,
    channelId: null,
    messageId: null,
    proof: null,
    processing: false,
  };
  cartAmounts(gs, cart);
  gs.carts.push(cart);
  const channel = await createCartChannel(interaction, gs, cart);
  const { prepararMensagem } = await import('../infraestrutura/resposta-painel.js');
  if (channel) {
    cart.channelId = channel.id;
    const sent = await channel.send(prepararMensagem(cartPayload(interaction.guild, gs, cart)));
    cart.messageId = sent.id;
    const link = `https://discord.com/channels/${interaction.guild.id}/${channel.id}`;
    return interaction.reply({
      content: `${EMOJI.yesgenesis} Seu carrinho \`${cart.publicId}\` foi criado!`,
      components: [new ActionRowBuilder().addComponents(linkButton(link, 'Ir para o carrinho', EMOJI.cartLoaded))],
      ephemeral: true,
    });
  }
  // Sem canal: responde V2 ephemeral (sem content — regra do Components V2)
  const v2 = cartPayload(interaction.guild, gs, cart);
  return interaction.reply(
    prepararMensagem({
      ...v2,
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }),
  );
}

async function handleCartButton(interaction, gs, action, cartId) {
  const cart = getCart(gs, cartId);
  const guild = interaction.guild;
  if (!cart) return interaction.reply({ content: 'Carrinho não encontrado.', ephemeral: true });
  if (action === 'cart-admin-approve') {
    if (!isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Você não possui permissão para aprovar este carrinho.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const result = await deliverCart(interaction, gs, cart, interaction.user.id);
    return interaction.editReply({ content: result.message });
  }
  if (action === 'cart-admin-decline') {
    if (!isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Você não possui permissão para recusar este carrinho.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const changed = await cancelCart(guild, gs, cart, 'DECLINED', `Pagamento recusado por ${interaction.user.tag || interaction.user.username}`);
    return interaction.editReply({ content: changed ? `Carrinho \`${cart.publicId}\` recusado.` : 'Este carrinho já foi encerrado.' });
  }
  if (!isCartOwner(interaction, cart) && !isCartAdmin(interaction, gs)) {
    return interaction.reply({ content: 'Este carrinho não pertence a você.', ephemeral: true });
  }
  if (action === 'cart-quantity') {
    if (!CART_EDITABLE_STATUSES.has(cart.status)) return interaction.reply({ content: 'Este carrinho não pode mais ser editado.', ephemeral: true });
    return interaction.showModal(modal(id('modal-cart-quantity', cart.id), 'Alterar Quantidade', [
      textInput('quantity', 'QUANTIDADE', 'Insira a quantia que deseja comprar, exemplo: 3', TextInputStyle.Short, true, String(cart.quantity || 1)),
    ]));
  }
  if (action === 'cart-qty-label') return interaction.deferUpdate();
  if (action === 'cart-qty-down' || action === 'cart-qty-up') {
    if (!CART_EDITABLE_STATUSES.has(cart.status)) return interaction.reply({ content: 'Este carrinho não pode mais ser editado.', ephemeral: true });
    const field = cartField(gs, cart);
    const limits = clampCartQuantity(cart, field);
    cart.quantity = action === 'cart-qty-up' ? Math.min(limits.max, cart.quantity + 1) : Math.max(limits.min, cart.quantity - 1);
    cart.updatedAt = Date.now();
    cartAmounts(gs, cart);
    return interaction.update(cartPayload(guild, gs, cart));
  }
  if (action === 'cart-coupon') {
    return interaction.showModal(modal(id('modal-cart-coupon', cart.id), 'Usar Cupom', [
      textInput('code', 'CÓDIGO DO CUPOM', 'Digite o código do cupom', TextInputStyle.Short, true, cart.couponCode || ''),
    ]));
  }
  if (action === 'cart-coupon-remove') {
    cart.couponCode = null;
    cartAmounts(gs, cart);
    return interaction.update(cartPayload(guild, gs, cart));
  }
  if (action === 'cart-checkout') {
    const field = cartField(gs, cart);
    if (!field || availableStock(field) < cart.quantity) return interaction.reply({ content: `${EMOJI.no} Estoque insuficiente para esta quantidade.`, ephemeral: true });
    if (field.requiredRole && !interaction.member?.roles?.cache?.has(field.requiredRole)) {
      return interaction.reply({ content: `${EMOJI.no} Você precisa do cargo <@&${field.requiredRole}> para concluir esta compra.`, ephemeral: true });
    }
    cart.status = 'PAYMENT_SELECTION';
    cart.updatedAt = Date.now();
    cartAmounts(gs, cart);
    return interaction.update(paymentPayload(guild, gs, cart));
  }
  if (action === 'cart-edit') {
    if (CART_TERMINAL_STATUSES.has(cart.status)) return interaction.reply({ content: 'Este carrinho já foi encerrado.', ephemeral: true });
    cart.status = 'OPEN';
    cart.paymentMethod = null;
    cart.proof = null;
    cart.updatedAt = Date.now();
    return interaction.update(cartPayload(guild, gs, cart));
  }
  if (action === 'cart-pay-manual') {
    if (!hasConfiguredPayment(gs)) return interaction.reply({ content: 'O pagamento manual não está disponível.', ephemeral: true });
    cart.paymentMethod = 'Pagamento Manual';
    cart.status = 'AWAITING_MANUAL_PAYMENT';
    cart.updatedAt = Date.now();
    cartAmounts(gs, cart);
    await sendOrderRequestedLog(guild, gs, cart);
    await interaction.deferUpdate();
    await interaction.message.delete().catch(() => null);
    await interaction.channel?.send({ content: pixCopyPasteCode(gs, cart) }).catch(() => null);
    const sent = await interaction.channel?.send(manualPaymentPayload(guild, gs, cart)).catch(() => null);
    if (sent) cart.messageId = sent.id;
    if (interaction.channel?.setName) await interaction.channel.setName(cartThreadName(cart, 'paid')).catch(() => null);
    return;
  }
  if (action === 'cart-copy-code') {
    return interaction.reply({ content: `\`\`\`${pixCopyPasteCode(gs, cart)}\`\`\``, ephemeral: true });
  }
  if (action === 'cart-confirm-payment') {
    if (!isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Apenas a equipe pode confirmar manualmente este pagamento.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    await interaction.message.delete().catch(() => null);
    const result = await deliverCart(interaction, gs, cart, interaction.user.id);
    return interaction.editReply({ content: result.message });
  }
  if (action === 'cart-pay-efi' || action === 'cart-pay-mercado') {
    const method = action === 'cart-pay-efi' ? 'Efí Bank (teste)' : 'Mercado Pago (teste)';
    cart.paymentMethod = method;
    cart.proof = 'Pagamento simulado em ambiente de teste — nenhuma cobrança foi realizada.';
    cart.status = 'AWAITING_APPROVAL';
    cart.updatedAt = Date.now();
    await interaction.update({
      embeds: [embed(`${EMOJI.loading} Pagamento de teste`, `Nenhuma cobrança real foi feita. O carrinho \`${cart.publicId}\` aguarda aprovação manual com \`/entregar\`.`, guild, method).setColor(0xf59e0b)],
      components: [new ActionRowBuilder().addComponents(button(id('cart-cancel', cart.id), 'Cancelar', ButtonStyle.Danger, EMOJI.redTrash))],
    });
    await sendApprovalLog(guild, gs, cart);
    return;
  }
  if (action === 'cart-proof') {
    return interaction.showModal(modal(id('modal-cart-proof', cart.id), 'Enviar comprovante', [
      textInput('proof', 'COMPROVANTE OU REFERÊNCIA*', 'Cole o link, ID ou descreva o comprovante', TextInputStyle.Paragraph),
    ]));
  }
  if (action === 'cart-cancel') {
    await interaction.deferUpdate();
    const changed = await cancelCart(guild, gs, cart, 'CANCELLED', `Cancelado por ${interaction.user.tag || interaction.user.username}`);
    if (!changed) await interaction.followUp({ content: 'Este carrinho já foi encerrado.', ephemeral: true });
    return;
  }
  return interaction.reply({ content: 'Ação de carrinho indisponível.', ephemeral: true });
}

  return {
    CART_TERMINAL_STATUSES,
    CART_EDITABLE_STATUSES,
    cartPublicId,
    getCart,
    cartProduct,
    cartField,
    availableStock,
    clampCartQuantity,
    findCartCoupon,
    cartAmounts,
    cartStatusLabel,
    cartBuyerName,
    cartThreadName,
    cartItemName,
    cartItemsText,
    cartSummaryContainer,
    paymentSummaryContainer,
    hasConfiguredPayment,
    pixCopyPasteCode,
    cartEmbed,
    cartComponents,
    cartPayload,
    paymentPayload,
    manualPaymentPayload,
    isCartOwner,
    isCartAdmin,
    createCartChannel,
    refreshCartMessage,
    syncSaleMessage,
    takeDelivery,
    deliverCart,
    cancelCart,
    startCart,
    handleCartButton,
  };
}
