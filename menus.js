import { tratarCanalAutomacoes, tratarMenuAutomacoes } from '../automacoes/interacoes-automacoes.js';
import { tratarCanalOutrasAutomacoes, tratarMenuOutrasAutomacoes } from '../automacoes/interacoes-outras-automacoes.js';

export function criarHandlersMenus(ctx) {
  const {
    ActionRowBuilder,
    ButtonStyle,
    CART_EDITABLE_STATUSES,
    ChannelType,
    EMOJI,
    StringSelectMenuBuilder,
    TEMAS_CORES_ZEND,
    TextInputStyle,
    availableStock,
    badgesPanel,
    balancePanel,
    balancePublicPayload,
    button,
    cartAmounts,
    cartField,
    cartPayload,
    cartProduct,
    channelSelectionPanel,
    channelsPanel,
    clampCartQuantity,
    conditionsPanel,
    customDetailPanel,
    embed,
    emojiTag,
    fieldPanel,
    findCartCoupon,
    getCart,
    getField,
    getProduct,
    giveawayChannelPanel,
    giveawayDetailPanel,
    giveawayExtrasPanel,
    giveawayRolesPanel,
    helpPanel,
    id,
    isCartAdmin,
    isCartOwner,
    linkButton,
    modal,
    money,
    oauthConfigPanel,
    positionPanel,
    positionsPanel,
    productPanel,
    protectAntiInvitePanel,
    protectDetailPanel,
    protectSelfBotPanel,
    roleSelectionPanel,
    rolesConfigPanel,
    rolesFieldPanel,
    salePayload,
    sendOrUpdate,
    stockPanel,
    storeCouponsPanel,
    storeOauthPanel,
    syncSaleMessage,
    tempRolePanel,
    textInput,
    ticketFunctionDetailPanel,
    ticketFunctionsPanel,
    ticketHoursPanel,
    ticketOpenModePanel,
    ticketOpeningPayload,
    ticketPanel,
    ticketStatsPanel,
    userDraft,
    openTicket,
  } = ctx;

async function handleSelect(interaction, gs) {
  const [, action, a, b, c] = interaction.customId.split(':');
  const value = interaction.values[0];
  const guild = interaction.guild;
  const product = getProduct(gs, a);
  const field = getField(product, b);

  if (await tratarMenuAutomacoes(interaction, gs, action, a)) return;
  if (await tratarMenuOutrasAutomacoes(interaction, gs, action, a)) return;

  // Abertura de ticket pela mensagem pública (2+ categorias = select)
  if (action === 'ticket-open-select') {
    if (!openTicket) {
      return interaction.reply({
        content: '❌ | Abertura de ticket indisponível no momento.',
        ephemeral: true,
      });
    }
    return openTicket(interaction, gs, value || 'support');
  }

  if (action === 'product-select') {
    return sendOrUpdate(interaction, productPanel(guild, getProduct(gs, value)));
  }
  if (action === 'position-role-select') {
    const pos = gs.positions[Number(a) - 1];
    if (!pos) return interaction.reply({ content: 'Posição não encontrada.', ephemeral: true });
    pos.roleId = value;
    return sendOrUpdate(interaction, positionPanel(guild, gs, Number(a)));
  }
  if (action === 'role-kind') {
    return sendOrUpdate(interaction, roleSelectionPanel(guild, gs, value));
  }
  if (action === 'giveaway-duration') {
    const draft = userDraft(interaction.user.id).giveaway;
    if (!draft) return interaction.reply({ content: 'Configuração de sorteio expirada.', ephemeral: true });
    draft.durationMs = Number(value);
    return sendOrUpdate(interaction, giveawayChannelPanel(guild, draft));
  }
  if (action === 'giveaway-allowed-roles') {
    const draft = userDraft(interaction.user.id).giveaway;
    draft.allowedRoles = [...interaction.values];
    return sendOrUpdate(interaction, giveawayRolesPanel(guild, draft));
  }
  if (action === 'giveaway-blocked-roles') {
    const draft = userDraft(interaction.user.id).giveaway;
    draft.blockedRoles = [...interaction.values];
    return sendOrUpdate(interaction, giveawayRolesPanel(guild, draft));
  }
  if (action === 'giveaway-extra-roles') {
    const draft = userDraft(interaction.user.id).giveaway;
    draft.extraEntries = Object.fromEntries(interaction.values.map((roleId) => [roleId, 1]));
    return sendOrUpdate(interaction, giveawayExtrasPanel(guild, draft));
  }
  if (action === 'giveaway-manage-select') {
    const giveaway = gs.giveaways.find((item) => item.id === value);
    return giveaway
      ? sendOrUpdate(interaction, giveawayDetailPanel(guild, giveaway))
      : interaction.reply({ content: 'Sorteio não encontrado.', ephemeral: true });
  }
  if (action === 'role-config-select') {
    const role = guild.roles.cache.get(value);
    const botRole = guild.members.me?.roles?.highest;
    if (!role) return interaction.reply({ content: '❌ | Cargo não encontrado.', ephemeral: true });
    if (botRole && role.position >= botRole.position) {
      return interaction.reply({
        content: `❌ | **Aviso de hierarquia**\n\nO cargo ${role} está acima (ou na mesma posição) do cargo mais alto do bot. Mova o cargo do bot para cima antes de continuar.`,
        ephemeral: true,
      });
    }
    if (a === 'notify' && role.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: `❌ | **Erro de Segurança**\n\nO cargo ${role} possui permissões administrativas e não pode ser definido como cargo de membro.`,
        ephemeral: true,
      });
    }
    gs.roles[a] = role.id;
    return sendOrUpdate(interaction, rolesConfigPanel(guild, gs));
  }
  if (action === 'field-role-select') {
    if (c === 'add') field.addRole = value;
    else field.removeRole = value;
    return sendOrUpdate(interaction, rolesFieldPanel(guild, product, field));
  }
  if (action === 'cond-role-select') {
    field.requiredRole = value;
    return sendOrUpdate(interaction, conditionsPanel(guild, product, field));
  }
  if (action === 'cart-field') {
    const cart = getCart(gs, a);
    if (!cart) return interaction.reply({ content: 'Carrinho não encontrado.', ephemeral: true });
    if (!isCartOwner(interaction, cart) && !isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Este carrinho não pertence a você.', ephemeral: true });
    if (!CART_EDITABLE_STATUSES.has(cart.status)) return interaction.reply({ content: 'Este carrinho não pode mais ser editado.', ephemeral: true });
    const cartProductRef = cartProduct(gs, cart);
    const selectedField = cartProductRef?.fields?.find((item) => item.id === value);
    if (!selectedField || availableStock(selectedField) <= 0) return interaction.reply({ content: `${EMOJI.no} Esta variação está sem estoque.`, ephemeral: true });
    if (selectedField.requiredRole && !interaction.member?.roles?.cache?.has(selectedField.requiredRole)) {
      return interaction.reply({ content: `${EMOJI.no} Você precisa do cargo <@&${selectedField.requiredRole}> para comprar esta variação.`, ephemeral: true });
    }
    cart.fieldId = selectedField.id;
    clampCartQuantity(cart, selectedField);
    cart.updatedAt = Date.now();
    cartAmounts(gs, cart);
    return interaction.update(cartPayload(guild, gs, cart));
  }

  if (action === 'help-menu') {
    return sendOrUpdate(interaction, helpPanel(guild, value));
  }
  if (action === 'field-select') {
    return sendOrUpdate(interaction, fieldPanel(guild, product, getField(product, value)));
  }
  if (action === 'field-emoji-select') {
    const emojiId = gs.emojis?.synced?.[value];
    if (!emojiId) return interaction.reply({ content: 'Emoji nao encontrado no estado local. Rode /syncemojis novamente.', ephemeral: true });
    field.emoji = emojiTag(value, emojiId, Boolean(gs.emojis?.animated?.[value]));
    return sendOrUpdate(interaction, fieldPanel(guild, product, field));
  }
  if (action === 'stock-remove-select') {
    const indexes = interaction.values.map(Number).sort((x, y) => y - x);
    for (const index of indexes) field.stock.splice(index, 1);
    await syncSaleMessage(guild, product);
    return sendOrUpdate(interaction, stockPanel(guild, product, field));
  }
  if (action === 'position-select') {
    return sendOrUpdate(interaction, positionPanel(guild, gs, Number(value)));
  }
  if (action === 'balance-menu') {
    if (value === 'all') {
      const users = Object.values(gs.balance.users);
      return sendOrUpdate(interaction, {
        content: users.length ? users.map((user) => `<@${user.id}> — ${money(user.balance)}`).join('\n') : 'Nenhum usuário com saldo registrado.',
        ephemeral: true,
      });
    }
    if (value === 'get') {
      return interaction.showModal(modal(id('modal-balance-get'), 'Consultar saldo por ID', [
        textInput('userId', 'ID DO USUÁRIO*', 'Insira o ID do usuário'),
      ]));
    }
    return interaction.showModal(modal(id('modal-balance-action', value), `${value === 'add' ? 'Adicionar' : value === 'remove' ? 'Remover' : 'Definir'} Saldo`, [
      textInput('userId', 'ID DO USUÁRIO*', 'Insira o ID do usuário'),
      textInput('amount', 'VALOR*', 'Ex: 10.00 ou 10,00'),
      textInput('reason', 'MOTIVO', 'Ex: Bônus de fidelidade', TextInputStyle.Short, false),
    ]));
  }
  if (action === 'store-more') {
    if (value === 'positions') return sendOrUpdate(interaction, positionsPanel(guild, gs));
    if (value === 'balance') return sendOrUpdate(interaction, balancePanel(guild, gs));
    if (value === 'coupons') return sendOrUpdate(interaction, storeCouponsPanel(guild, gs));
    if (value === 'badges') return sendOrUpdate(interaction, badgesPanel(guild, gs));
    if (value === 'temp-role') return sendOrUpdate(interaction, tempRolePanel(guild, gs));
    if (value === 'oauth2') return sendOrUpdate(interaction, storeOauthPanel(guild, gs));
  }
  if (action === 'ticket-menu') {
    if (value === 'appearance') {
      return interaction.showModal(modal(id('modal-ticket-appearance'), 'Configurar Aparência', [
        textInput('title', 'TÍTULO', 'Título da mensagem', TextInputStyle.Short, true, gs.ticket.title),
        textInput('description', 'DESCRIÇÃO', 'Descrição da mensagem', TextInputStyle.Paragraph, true, gs.ticket.description),
        textInput('banner', 'BANNER', 'URL de banner', TextInputStyle.Short, false, gs.ticket.banner),
        textInput('color', 'COR DO EMBED (OPCIONAL)', 'FFFFFF', TextInputStyle.Short, false, gs.ticket.color || '#FFFFFF'),
      ]));
    }
    if (value === 'add-function') {
      return interaction.showModal(modal(id('modal-ticket-function'), 'Adicionar Função', [
        textInput('name', 'NOME', 'Ex: Suporte'),
        textInput('preDescription', 'PRÉ DESCRIÇÃO', 'Ex: Preciso de suporte'),
        textInput('description', 'DESCRIÇÃO (OPCIONAL)', 'Descrição completa da função', TextInputStyle.Paragraph, false),
        textInput('banner', 'BANNER (OPCIONAL)', 'URL de uma imagem ou GIF', TextInputStyle.Short, false),
        textInput('emoji', 'EMOJI', 'Emoji opcional', TextInputStyle.Short, false),
      ]));
    }
    if (value === 'functions') return sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
    if (value === 'hours') return sendOrUpdate(interaction, ticketHoursPanel(guild, gs));
    if (value === 'stats') return sendOrUpdate(interaction, ticketStatsPanel(guild, gs));
    if (value === 'open-mode') return sendOrUpdate(interaction, ticketOpenModePanel(guild, gs));
    if (value === 'message-mode') {
      gs.ticket.messageMode = gs.ticket.messageMode === 'Embed Clássico' ? 'Container V2' : 'Embed Clássico';
      return sendOrUpdate(interaction, ticketPanel(guild, gs));
    }
    return sendOrUpdate(interaction, ticketPanel(guild, gs));
  }
  if (action === 'ticket-function-select') {
    const fn = gs.ticket.functions.find((item) => item.id === value);
    return fn ? sendOrUpdate(interaction, ticketFunctionDetailPanel(guild, fn)) : sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
  }
  if (action === 'ticket-day') {
    const day = gs.ticket.hoursByDay[Number(value)];
    userDraft(interaction.user.id).ticketDay = Number(value);
    return interaction.showModal(modal(id('modal-ticket-day', value), 'Configurar Horário do Dia', [
      textInput('active', 'ATIVO?*', 'Sim ou Não', TextInputStyle.Short, true, day.active ? 'Sim' : 'Não'),
      textInput('openAt', 'HORÁRIO INICIAL*', 'Ex: 09:00', TextInputStyle.Short, true, day.openAt),
      textInput('closeAt', 'HORÁRIO FINAL*', 'Ex: 18:00', TextInputStyle.Short, true, day.closeAt),
    ]));
  }
  if (action === 'ticket-panel-select') {
    const ticket = gs.tickets.find((item) => item.id === a);
    if (!ticket) return interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
    if (value === 'staff') {
      if (!isCartAdmin(interaction, gs)) {
        return interaction.reply({ content: '❌ | Apenas membros da equipe podem acessar o Painel Staff.\nℹ️ Você precisa ter o cargo de Administrador ou Suporte.', ephemeral: true });
      }
      const staffActions = new StringSelectMenuBuilder()
        .setCustomId(id('ticket-staff-action', ticket.id))
        .setPlaceholder('🛡️ Escolha uma ação')
        .addOptions(
          { label: 'Adicionar Membro', description: 'Adicionar um usuário ao ticket', value: 'add', emoji: '👥' },
          { label: 'Criar Call', description: 'Criar canal de voz temporário', value: 'call', emoji: '🔊' },
          { label: 'Pedir Gank', description: 'Solicitar ajuda de outros staffs', value: 'gank', emoji: '🆘' },
          { label: 'Renomear Ticket', description: 'Alterar o nome do ticket', value: 'rename', emoji: '✏️' },
        );
      return sendOrUpdate(interaction, {
        embeds: [embed(
          '🛡️ Painel Staff',
          'Selecione uma ação abaixo para gerenciar o ticket:\n\n👥 **Adicionar Membro** — Adicione um usuário ao ticket\n🔊 **Criar Call** — Crie um canal de voz para o atendimento\n🆘 **Pedir Gank** — Solicite ajuda de outros staffs\n✏️ **Renomear Ticket** — Altere o nome do ticket',
          guild,
        )],
        components: [
          new ActionRowBuilder().addComponents(staffActions),
          new ActionRowBuilder().addComponents(
            button(id('ticket-notify', ticket.id), 'Notificar', ButtonStyle.Primary, '🕘'),
            button(id('ticket-close', ticket.id), 'Deletar e Salvar', ButtonStyle.Danger, '🗑️'),
          ),
        ],
      });
    }
    const memberActions = new StringSelectMenuBuilder()
      .setCustomId(id('ticket-member-action', ticket.id))
      .setPlaceholder('♟️ Escolha uma ação')
      .addOptions(
        { label: 'Adicionar Participante', description: 'Convide um usuário para o ticket', value: 'add', emoji: '➕' },
        { label: 'Chamar Atendente', description: 'Notifique o staff responsável', value: 'notify', emoji: '📣' },
      );
    return sendOrUpdate(interaction, {
      embeds: [embed(
        '♟️ Painel do Membro',
        'Selecione uma ação abaixo:\n\n➕ **Adicionar Participante** — Convide alguém para o ticket\n📣 **Chamar Atendente** — Notifique o staff responsável',
        guild,
      )],
      components: [
        new ActionRowBuilder().addComponents(memberActions),
        new ActionRowBuilder().addComponents(button(id('ticket-close', ticket.id), 'Deletar e Salvar', ButtonStyle.Danger, '🗑️')),
      ],
    });
  }
  if (action === 'ticket-staff-action') {
    if (value === 'add') return interaction.showModal(modal(id('modal-ticket-add-member', a), 'Adicionar Membro', [textInput('userId', 'ID DO USUÁRIO*', 'Insira o ID do usuário')]));
    if (value === 'rename') return interaction.showModal(modal(id('modal-ticket-rename', a), 'Renomear Ticket', [textInput('name', 'Novo nome do ticket*', 'Digite o novo nome para o ticket')]));
    if (value === 'call') {
      const ticket = gs.tickets.find((item) => item.id === a);
      const voice = ticket ? await guild.channels.create({
        name: `🔊・${interaction.user.username}・call`,
        type: ChannelType.GuildVoice,
        parent: interaction.channel?.parentId || undefined,
        reason: `Call do ticket ${ticket.id}`,
      }).catch(() => null) : null;
      return interaction.reply({ content: voice ? `✅ | Call criada com sucesso: ${voice}` : '❌ | Não foi possível criar a call.', ephemeral: true });
    }
    if (value === 'gank') {
      if (!gs.roles.staff) return interaction.reply({ content: '❌ | Nenhum staff disponível encontrado para gank.', ephemeral: true });
      await interaction.channel?.send({ content: `<@&${gs.roles.staff}> ajuda solicitada por ${interaction.user}.` }).catch(() => null);
      return interaction.reply({ content: '✅ | Pedido de ajuda enviado.', ephemeral: true });
    }
  }
  if (action === 'ticket-member-action') {
    if (value === 'add') return interaction.showModal(modal(id('modal-ticket-add-member', a), 'Adicionar Participante', [textInput('userId', 'ID DO USUÁRIO*', 'Insira o ID do usuário')]));
    if (value === 'notify') {
      const ticket = gs.tickets.find((item) => item.id === a);
      const staffMention = gs.roles.staff ? `<@&${gs.roles.staff}>` : 'equipe de suporte';
      await interaction.channel?.send({ content: `${staffMention}, ${interaction.user} solicitou atendimento.` }).catch(() => null);
      return interaction.reply({ content: '✅ | Atendente chamado com sucesso.', ephemeral: true });
    }
  }
  if (action === 'custom-menu') {
    return sendOrUpdate(interaction, customDetailPanel(guild, gs, value));
  }
  if (action === 'custom-color-select') {
    userDraft(interaction.user.id).customColorKey = value;
    const labels = { default: 'Principal', processing: 'Processamento', success: 'Sucesso', error: 'Falha', finished: 'Finalizado' };
    return interaction.showModal(modal(id('modal-custom-color', value), `Editar cor: ${labels[value] || value}`, [
      textInput('color', 'COR EM HEX*', '#FFFFFF', TextInputStyle.Short, true, gs.customization.colors[value]),
    ]));
  }
  if (action === 'custom-theme-select') {
    gs.customization.colors = { ...TEMAS_CORES_ZEND[value] };
    return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'colors'));
  }
  if (action === 'custom-bot-select') {
    const labels = { nickname: 'Alterar Nickname', avatar: 'Alterar Avatar', banner: 'Alterar Banner', status1: 'Alterar Status 1', status2: 'Alterar Status 2' };
    return interaction.showModal(modal(id('modal-custom-bot-field', value), labels[value] || 'Personalizar Bot', [
      textInput('value', labels[value] || 'VALOR', value === 'nickname' ? 'Nome do bot no servidor' : value.startsWith('status') ? 'Texto do status rotativo' : 'URL da imagem', TextInputStyle.Short, true, gs.customization.bot[value]),
    ]));
  }
  if (action === 'custom-public-select') {
    if (value === 'image') {
      return interaction.showModal(modal(id('modal-custom-public-image'), 'Imagem do Log Público', [
        textInput('image', 'URL da Imagem*', 'https://exemplo.com/imagem.png', TextInputStyle.Short, true, gs.customization.publicLog.image),
      ]));
    }
    if (value === 'remove-image') gs.customization.publicLog.image = '';
    if (value === 'v2') gs.customization.publicLog.v2 = !gs.customization.publicLog.v2;
    if (value === 'buy') gs.customization.publicLog.showBuy = !gs.customization.publicLog.showBuy;
    if (value === 'feedback') gs.customization.publicLog.showFeedback = !gs.customization.publicLog.showFeedback;
    return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'public-log'));
  }
  if (action === 'channel-kind') {
    userDraft(interaction.user.id).channelKind = value;
    return sendOrUpdate(interaction, channelSelectionPanel(guild, gs, value));
  }
  if (action === 'protect-menu') {
    return sendOrUpdate(interaction, protectDetailPanel(guild, gs, value));
  }
  if (action === 'protect-moderation-menu') {
    return sendOrUpdate(interaction, value === 'selfbot' ? protectSelfBotPanel(guild, gs) : protectAntiInvitePanel(guild, gs));
  }
  if (action === 'protect-whitelist-select') {
    gs.protect.antiInvite.whitelistRoles = [...interaction.values];
    return sendOrUpdate(interaction, protectAntiInvitePanel(guild, gs));
  }
  if (action === 'oauth-role-select') {
    gs.cloud.verifiedRoleId = value;
    return sendOrUpdate(interaction, oauthConfigPanel(guild, gs));
  }
}

async function handleChannelSelect(interaction, gs) {
  const [, action, a] = interaction.customId.split(':');
  const channelId = interaction.values[0];
  if (await tratarCanalAutomacoes(interaction, gs, action, a)) return;
  if (await tratarCanalOutrasAutomacoes(interaction, gs, action, a)) return;
  if (action === 'giveaway-channel') {
    const draft = userDraft(interaction.user.id).giveaway;
    if (!draft) return interaction.reply({ content: 'Configuração de sorteio expirada.', ephemeral: true });
    draft.channelId = channelId;
    return interaction.update({ ...giveawayRolesPanel(interaction.guild, draft), attachments: [] });
  }
  if (action === 'protect-channel-set') {
    const config = a === 'selfbot' ? gs.protect.selfBot : gs.protect.antiInvite;
    config.logChannel = channelId;
    return interaction.update({
      ...(a === 'selfbot' ? protectSelfBotPanel(interaction.guild, gs) : protectAntiInvitePanel(interaction.guild, gs)),
      content: null,
      attachments: [],
    });
  }
  if (action === 'sell-channel') {
    const product = getProduct(gs, a);
    const channel = await interaction.guild.channels.fetch(channelId);
    const { prepararMensagem } = await import('../infraestrutura/resposta-painel.js');
    const msg = await channel.send(prepararMensagem(salePayload(product, gs)));
    product.salesMessage = { channelId, messageId: msg.id };
    await interaction.update({
      content: `${EMOJI.yesgenesis} | Mensagem postada${gs.customization?.productMessages?.v2 ? ' (Container V2)' : ''}!`,
      components: [new ActionRowBuilder().addComponents(linkButton(msg.url, 'Ir para mensagem'))],
      embeds: [],
    });
    return;
  }
  if (action === 'ticket-post-channel') {
    const channel = await interaction.guild.channels.fetch(channelId);
    const { prepararMensagem } = await import('../infraestrutura/resposta-painel.js');
    const payload = prepararMensagem(ticketOpeningPayload(interaction.guild, gs));
    const message = await channel.send(payload);
    gs.ticket.postedMessages.push({ channelId, messageId: message.id });
    await interaction.update({
      content: `${EMOJI.yesgenesis} | Mensagem de ticket postada${gs.ticket.messageMode === 'Container V2' ? ' (V2)' : ''}!`,
      components: [new ActionRowBuilder().addComponents(linkButton(message.url, 'Ir para o canal'))],
      embeds: [],
      attachments: [],
    });
    return;
  }
  if (action === 'balance-post-channel') {
    const channel = await interaction.guild.channels.fetch(channelId);
    await channel.send(balancePublicPayload(interaction.guild, gs));
    await interaction.update({ content: `${EMOJI.yesgenesis} | Painel de saldo postado em <#${channelId}>.`, components: [], embeds: [] });
    return;
  }
  if (action === 'automation-channel-set') {
    gs.automations[a].channel = channelId;
    await interaction.update({ content: `${EMOJI.yesgenesis} | Canal da automação definido: <#${channelId}>.`, components: [], embeds: [] });
    return;
  }
  if (action === 'protect-log-channel') {
    gs.protect.logChannel = channelId;
    await interaction.update({ content: `${EMOJI.yesgenesis} | Canal de logs do zenProtect definido: <#${channelId}>.`, components: [], embeds: [] });
    return;
  }
  if (action === 'generic-channel') {
    gs.channels[a] = channelId;
    await interaction.update({ content: `${EMOJI.yesgenesis} | Canal configurado: <#${channelId}>.`, components: [], embeds: [] });
    return;
  }
  if (action === 'channel-set') {
    const kind = userDraft(interaction.user.id).channelKind;
    if (!kind || !(kind in gs.channels)) {
      return interaction.update(channelsPanel(interaction.guild, gs));
    }
    gs.channels[kind] = channelId;
    delete userDraft(interaction.user.id).channelKind;
    await interaction.update({ ...channelsPanel(interaction.guild, gs), content: null, attachments: [] });
  }
}

  return { handleSelect, handleChannelSelect };
}
