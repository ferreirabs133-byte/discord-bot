import { tratarBotaoAutomacoes } from '../automacoes/interacoes-automacoes.js';
import { tratarBotaoOutrasAutomacoes } from '../automacoes/interacoes-outras-automacoes.js';
import { painelMensagensAutomaticas } from '../automacoes/paineis-mensagens.js';
import { painelLimpezaAutomatica } from '../automacoes/paineis-limpeza.js';
import { painelInviteTracker, painelLockUnlock, painelMonitorFeedbacks, painelRestock } from '../automacoes/paineis-outras-automacoes.js';
import { notificarRestock } from '../automacoes/servico-automacoes.js';

export function criarHandlerBotoes(ctx) {
  const {
    ActionRowBuilder,
    ButtonStyle,
    CANAIS_AUTOMATICOS_ZEND,
    CART_EDITABLE_STATUSES,
    CART_TERMINAL_STATUSES,
    CLIENT_ID,
    ChannelType,
    EMOJI,
    EmbedBuilder,
    PermissionFlagsBits,
    TEMAS_CORES_ZEND,
    TextInputStyle,
    antiFakePanel,
    automationFeaturePanel,
    automationsPanel,
    availableStock,
    badgesPanel,
    balancePanel,
    button,
    cartAmounts,
    cartField,
    cartPayload,
    cartProduct,
    channelSelectRow,
    channelsPanel,
    clampCartQuantity,
    cloudPanel,
    conditionRolePickerPanel,
    conditionsPanel,
    couponsPanel,
    customDetailPanel,
    customPanel,
    defaultGuildState,
    deliverCart,
    draftProductPanel,
    embed,
    emojiSyncSummary,
    fieldEmojiPanel,
    fieldPanel,
    fieldRolePickerPanel,
    fieldsPanel,
    findCartCoupon,
    finishGiveaway,
    gatewayPaymentPanel,
    getCart,
    getField,
    getProduct,
    giveawayDurationPanel,
    giveawayExtrasPanel,
    giveawayManagePanel,
    giveawayMessagePayload,
    giveawayPanel,
    giveawayRolesPanel,
    guildState,
    handleCartButton,
    id,
    isCartAdmin,
    isCartOwner,
    linkButton,
    mainPanel,
    manualPaymentPanel,
    modal,
    money,
    oauthConfigPanel,
    oauthPanel,
    oauthRolePanel,
    openTicket,
    outOfStockEmbed,
    parseDuration,
    parseHex,
    paymentsPanel,
    positionsPanel,
    productListPanel,
    productPanel,
    protectAntiInvitePanel,
    protectChannelSelectionPanel,
    protectDetailPanel,
    protectPanel,
    protectSelfBotPanel,
    protectWhitelistPanel,
    refreshCartMessage,
    renderWelcome,
    repostPanel,
    rolesConfigPanel,
    rolesFieldPanel,
    scheduleGiveaway,
    sendApprovalLog,
    sendConfiguredLog,
    sendOrUpdate,
    settingsPanel,
    simplePanel,
    startCart,
    statementChartPanel,
    statementHistoryPanel,
    statementPanel,
    statementPeriodPanel,
    stockCount,
    stockPanel,
    stockRemovePanel,
    storeOauthPanel,
    storePanel,
    syncLocalEmojis,
    syncSaleMessage,
    tempRolePanel,
    textInput,
    ticketFunctionDetailPanel,
    ticketFunctionsPanel,
    ticketHelpEmbed,
    ticketHoursPanel,
    ticketOpenModePanel,
    ticketOpeningPayload,
    ticketPanel,
    ticketPreview,
    ticketStatsPanel,
    userDraft,
    welcomePanel,
    zenWalletPanel,
  } = ctx;

  return async function handleButton(interaction, gs) {
  const [, action, a, b, c] = interaction.customId.split(':');
  const guild = interaction.guild;
  const product = getProduct(gs, a);
  const field = getField(product, b);

  if (action.startsWith('cart-')) return handleCartButton(interaction, gs, action, a);
  if (await tratarBotaoAutomacoes(interaction, gs, action, a, b)) return;
  if (await tratarBotaoOutrasAutomacoes(interaction, gs, action, a, b)) return;

  switch (action) {
    case 'home': return sendOrUpdate(interaction, mainPanel(guild));
    case 'store': return sendOrUpdate(interaction, storePanel(guild, gs, interaction.user));
    case 'ticket': return sendOrUpdate(interaction, ticketPanel(guild, gs));
    case 'welcome': return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'automations': return sendOrUpdate(interaction, automationsPanel(guild));
    case 'custom': return sendOrUpdate(interaction, customPanel(guild));
    case 'statement': return sendOrUpdate(interaction, statementPanel(guild, gs, interaction.user));
    case 'giveaway': return sendOrUpdate(interaction, giveawayPanel(guild, gs));
    case 'settings': return sendOrUpdate(interaction, settingsPanel(guild));
    case 'protect': return sendOrUpdate(interaction, protectPanel(guild));
    case 'cloud': return sendOrUpdate(interaction, cloudPanel(guild, gs));
    case 'positions': return sendOrUpdate(interaction, positionsPanel(guild, gs));
    case 'position-set':
      return interaction.showModal(modal(id('modal-position-role', a), `Configurar ${a}ª Posição`, [
        textInput('roleId', 'ID DO CARGO*', 'Insira o ID do cargo para esta posição'),
      ]));
    case 'position-remove':
      gs.positions[Number(a) - 1].roleId = null;
      return sendOrUpdate(interaction, positionsPanel(guild, gs));
    case 'balance-toggle':
      gs.balance.enabled = !gs.balance.enabled;
      return sendOrUpdate(interaction, balancePanel(guild, gs));
    case 'balance-post':
      return interaction.reply({ content: 'Selecione o canal onde quer postar o painel de recarga.', components: [channelSelectRow(id('balance-post-channel'))], ephemeral: true });
    case 'balance-recharge':
      return interaction.showModal(modal(id('modal-balance-recharge'), 'Solicitar recarga de saldo', [
        textInput('amount', 'VALOR DA RECARGA*', 'Ex: 25,00'),
        textInput('note', 'OBSERVAÇÃO', 'Opcional', TextInputStyle.Paragraph, false),
      ]));
    case 'coupon-create':
      return interaction.showModal(modal(id('modal-mass-coupon-create'), 'Criar Cupom', [
        textInput('code', 'CÓDIGO*', 'Ex: ZEND10'),
        textInput('discount', 'DESCONTO*', 'Ex: 10'),
        textInput('validity', 'VALIDADE - OPCIONAL', 'Ex: 7 dias', TextInputStyle.Short, false),
      ]));
    case 'mass-coupon-create':
      return interaction.showModal(modal(id('modal-mass-coupon-create'), 'Criar cupom em massa', [
        textInput('code', 'CÓDIGO*', 'Ex: ZEND10'),
        textInput('discount', 'DESCONTO*', 'Ex: 10'),
        textInput('validity', 'VALIDADE - OPCIONAL', 'Ex: 7 dias', TextInputStyle.Short, false),
      ]));
    case 'coupon-list':
      return interaction.reply({ content: gs.products.flatMap((product) => (product.coupons || []).map((coupon) => `\`${coupon.code}\` - ${product.name}`)).join('\n') || 'Nenhum cupom criado.', ephemeral: true });
    case 'coupon-by-product':
      return interaction.reply({ content: 'Abra **Produtos > Gerenciar cupons** para visualizar por produto.', ephemeral: true });
    case 'coupon-expired':
      return interaction.reply({ content: 'Nenhum cupom expirado encontrado.', ephemeral: true });
    case 'coupon-help':
      return interaction.reply({ content: 'Cupons podem ser criados por produto ou em massa para todos os produtos.', ephemeral: true });
    case 'mass-coupon-remove':
      return interaction.showModal(modal(id('modal-mass-coupon-remove'), 'Remover cupom em massa', [
        textInput('code', 'CÓDIGO*', 'Código que será removido de todos os produtos'),
      ]));
    case 'badge-toggle':
      gs.badgeSettings.enabled = !gs.badgeSettings.enabled;
      return sendOrUpdate(interaction, badgesPanel(guild, gs));
    case 'badge-dm':
      gs.badgeSettings.dm = !gs.badgeSettings.dm;
      return sendOrUpdate(interaction, badgesPanel(guild, gs));
    case 'badge-announcements':
      gs.badgeSettings.announcements = !gs.badgeSettings.announcements;
      return sendOrUpdate(interaction, badgesPanel(guild, gs));
    case 'badge-channel':
      return interaction.reply({ content: 'Selecione o canal de anúncios das condecorações.', components: [channelSelectRow(id('generic-channel', 'badgeAnnouncement'))], ephemeral: true });
    case 'badge-edit':
    case 'badge-new':
      return interaction.showModal(modal(id('modal-badge-new'), 'Criar condecoração', [
        textInput('name', 'NOME*', 'Ex: Cliente Ouro'),
        textInput('amount', 'META DE COMPRA*', 'Ex: 100.00'),
        textInput('emoji', 'EMOJI', 'Ex: 🏆', TextInputStyle.Short, false),
        textInput('roleId', 'ID DO CARGO (OPCIONAL)', 'Cargo entregue ao bater a meta', TextInputStyle.Short, false),
      ]));
    case 'badge-display':
      gs.badgeSettings.display = !gs.badgeSettings.display;
      return sendOrUpdate(interaction, badgesPanel(guild, gs));
    case 'badge-sync':
      return interaction.reply({ content: `${EMOJI.yesgenesis} | Condecorações sincronizadas para os clientes registrados.`, ephemeral: true });
    case 'badge-clear':
      gs.badges = [];
      return sendOrUpdate(interaction, badgesPanel(guild, gs));
    case 'temp-role-new':
      return interaction.showModal(modal(id('modal-temp-role-new'), 'Vincular cargo temporário', [
        textInput('productName', 'PRODUTO/CAMPO*', 'Nome do produto ou campo'),
        textInput('roleId', 'ID DO CARGO*', 'Cargo temporário entregue'),
        textInput('days', 'DURAÇÃO EM DIAS*', 'Ex: 30'),
      ]));
    case 'temp-role-toggle':
      gs.tempRoleSettings.enabled = !gs.tempRoleSettings.enabled;
      return sendOrUpdate(interaction, tempRolePanel(guild, gs));
    case 'temp-role-products':
      return sendOrUpdate(interaction, productListPanel(guild, gs));
    case 'temp-role-members':
      return interaction.reply({ content: 'Nenhum membro com cargo temporário ativo.', ephemeral: true });
    case 'temp-role-config':
      return interaction.showModal(modal(id('modal-temp-role-config'), 'Configurar Cargo Temporário', [
        textInput('removeExpired', 'REMOVER AO EXPIRAR?*', 'Sim ou Não', TextInputStyle.Short, true, gs.tempRoleSettings.removeExpired ? 'Sim' : 'Não'),
        textInput('notifyDm', 'NOTIFICAR POR DM?*', 'Sim ou Não', TextInputStyle.Short, true, gs.tempRoleSettings.notifyDm ? 'Sim' : 'Não'),
      ]));
    case 'temp-role-manual':
      return interaction.showModal(modal(id('modal-temp-role-new'), 'Adicionar cargo temporário manual', [
        textInput('productName', 'USUÁRIO/REFERÊNCIA*', 'ID do usuário ou referência'),
        textInput('roleId', 'ID DO CARGO*', 'Cargo temporário entregue'),
        textInput('days', 'DURAÇÃO EM DIAS*', 'Ex: 30'),
      ]));
    case 'temp-role-help':
      return interaction.reply({ content: 'Cargos temporários são vinculados a produtos e removidos automaticamente após a duração configurada.', ephemeral: true });
    case 'temp-role-clear':
      gs.tempRoles = [];
      return sendOrUpdate(interaction, tempRolePanel(guild, gs));
    case 'store-oauth-toggle':
      gs.storeOauth.required = !gs.storeOauth.required;
      return sendOrUpdate(interaction, storeOauthPanel(guild, gs));
    case 'store-oauth-disable-tickets':
      return interaction.reply({ content: `${EMOJI.yesgenesis} | OAuth2 em tickets alternado.`, ephemeral: true });
    case 'store-oauth-disable-carts':
      return interaction.reply({ content: `${EMOJI.yesgenesis} | OAuth2 em carrinhos alternado.`, ephemeral: true });
    case 'store-oauth-refresh-link':
      return interaction.reply({ content: `${EMOJI.yesgenesis} | Link de autenticação atualizado.`, ephemeral: true });
    case 'store-oauth-text':
      return interaction.showModal(modal(id('modal-store-oauth-text'), 'Editar texto OAuth2', [
        textInput('text', 'TEXTO DA MENSAGEM*', 'Mensagem exibida antes da autenticação', TextInputStyle.Paragraph),
      ]));
    case 'store-oauth-preview':
      return interaction.reply({ embeds: [embed('Autenticação OAuth2', 'Para continuar, autentique-se pelo link de autorização da loja.', guild, 'OAuth2')], ephemeral: true });

    case 'product-new':
      return interaction.showModal(modal(id('modal-product-name'), 'Criar Produto - Etapa 1', [
        textInput('name', 'Nome do produto*', 'Insira o nome do seu produto'),
      ]));
    case 'products':
      if (!gs.products.length) {
        return interaction.reply({ content: 'Não há produtos criados no momento, Dê /panel e crie seu primeiro produto!', ephemeral: true });
      }
      return sendOrUpdate(interaction, productListPanel(guild, gs));
    case 'out-of-stock':
      return sendOrUpdate(interaction, {
        embeds: [outOfStockEmbed(guild, gs)],
        components: [new ActionRowBuilder().addComponents(button(id('products'), 'Voltar', ButtonStyle.Secondary, EMOJI.left))],
      });
    case 'draft-desc':
      return interaction.showModal(modal(id('modal-draft-desc'), 'Definir Descrição', [
        textInput('description', 'DESCRIÇÃO DO PRODUTO', 'Insira uma boa descrição para o seu produto', TextInputStyle.Paragraph),
      ]));
    case 'draft-auto': {
      const draft = userDraft(interaction.user.id).product;
      draft.autoDelivery = !draft.autoDelivery;
      return sendOrUpdate(interaction, draftProductPanel(guild, draft));
    }
    case 'draft-banner':
      return interaction.showModal(modal(id('modal-draft-banner'), 'Definir Banner', [
        textInput('url', 'URL DO BANNER (OPCIONAL)', 'Insira uma URL de uma imagem ou gif', TextInputStyle.Short, false),
      ]));
    case 'draft-icon':
      return interaction.showModal(modal(id('modal-draft-icon'), 'Definir Ícone', [
        textInput('url', 'URL DO ÍCONE (OPCIONAL)', 'Insira uma URL de uma imagem ou gif', TextInputStyle.Short, false),
      ]));
    case 'draft-create': {
      const draft = userDraft(interaction.user.id).product;
      const created = { ...draft, id: crypto.randomUUID(), fields: [], coupons: [], salesMessage: null };
      gs.products.push(created);
      delete userDraft(interaction.user.id).product;
      return sendOrUpdate(interaction, productPanel(guild, created));
    }

    case 'product': return sendOrUpdate(interaction, productPanel(guild, product));
    case 'product-edit':
      return interaction.showModal(modal(id('modal-product-edit', product.id), 'Criação', [
        textInput('name', 'NOME', 'Insira o nome desejado', TextInputStyle.Short, true, product.name),
        textInput('description', 'DESCRIÇÃO', 'Insira uma descriação desejada', TextInputStyle.Paragraph, true, product.description),
        textInput('autoDelivery', 'ENTREGA AUTOMÁTICA?', 'Sim ou Não', TextInputStyle.Short, true, product.autoDelivery ? 'Sim' : 'Não'),
        textInput('icon', 'ICONE', 'Insira uma URL de uma imagem ou gif', TextInputStyle.Short, false, product.icon),
        textInput('banner', 'BANNER', 'Insira uma URL de uma imagem ou gif', TextInputStyle.Short, false, product.banner),
      ]));
    case 'product-delete':
      gs.products = gs.products.filter((p) => p.id !== product.id);
      return sendOrUpdate(interaction, storePanel(guild, gs, interaction.user));
    case 'product-sync':
      await syncSaleMessage(guild, product);
      return interaction.reply({ content: `${EMOJI.yesgenesis} | Produto sincronizado com sucesso.`, ephemeral: true });

    case 'fields': return sendOrUpdate(interaction, fieldsPanel(guild, product));
    case 'field':
      return sendOrUpdate(interaction, fieldPanel(guild, product, field));
    case 'field-stock':
      if (!isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Apenas a equipe pode editar o estoque por esta log.', ephemeral: true });
      return interaction.reply({ ...stockPanel(guild, product, field), ephemeral: true });
    case 'field-new':
      return interaction.showModal(modal(id('modal-field-new', product.id), 'Criar campo - Variação', [
        textInput('name', 'NOME DO CAMPO*', 'Insira o nome desejado'),
        textInput('description', 'DESCRIÇÃO DO CAMPO (OPCIONAL)', 'Insira uma descriação desejada', TextInputStyle.Paragraph, false),
        textInput('price', 'PREÇO DO CAMPO*', 'Insira um preço desejado (BRL)'),
      ]));
    case 'field-remove':
      product.fields.pop();
      return sendOrUpdate(interaction, fieldsPanel(guild, product));
    case 'field-help':
      return interaction.reply({ content: 'Campos são variações vendáveis do produto. Cada campo possui preço, estoque, condições, cargos e instruções.', ephemeral: true });
    case 'field-edit':
      return interaction.showModal(modal(id('modal-field-edit', product.id, field.id), 'Editando o campo', [
        textInput('name', 'NOME DO CAMPO*', 'Insira o nome desejado', TextInputStyle.Short, true, field.name),
        textInput('price', 'PREÇO DO CAMPO*', 'Insira um preço desejado (BRL)', TextInputStyle.Short, true, String(field.price).replace('.', ',')),
        textInput('description', 'DESCRIÇÃO DO CAMPO (OPCIONAL)', 'Insira um descrição desejada | Dica: Geralmente não é necessário.', TextInputStyle.Paragraph, false, field.description),
      ]));
    case 'field-emoji': {
      const payload = fieldEmojiPanel(guild, gs, product, field);
      if (!payload) {
        const files = await localEmojiFiles();
        return interaction.reply({
          content: files.length
            ? `${EMOJI.no} Encontrei emojis locais, mas eles ainda nao foram sincronizados. Use \`/syncemojis\` primeiro.`
            : `${EMOJI.no} Nenhum emoji customizado foi encontrado em \`discord-emojis/upload\`.`,
          ephemeral: true,
        });
      }
      return sendOrUpdate(interaction, payload);
    }
    case 'field-emoji-clear':
      delete field.emoji;
      return sendOrUpdate(interaction, fieldPanel(guild, product, field));
    case 'field-roles':
      return sendOrUpdate(interaction, rolesFieldPanel(guild, product, field));
    case 'field-role-add':
      return sendOrUpdate(interaction, fieldRolePickerPanel(guild, product, field, 'add'));
    case 'field-role-rem':
      return sendOrUpdate(interaction, fieldRolePickerPanel(guild, product, field, 'rem'));
    case 'field-role-id':
      return interaction.showModal(modal(id('modal-role-id', product.id, field.id, c), c === 'add' ? 'Inserir ID do Cargo (Adicionar)' : 'Inserir ID do Cargo (Remover)', [
        textInput('roleId', c === 'add' ? 'ID DO CARGO PARA ADICIONAR*' : 'ID DO CARGO PARA REMOVER*', c === 'add' ? 'Insira o ID do cargo que será adicionado após a compra' : 'Insira o ID do cargo que será removido após a compra'),
      ]));
    case 'field-conditions':
      return sendOrUpdate(interaction, conditionsPanel(guild, product, field));
    case 'cond-role':
      return sendOrUpdate(interaction, conditionRolePickerPanel(guild, product, field));
    case 'cond-role-id':
      return interaction.showModal(modal(id('modal-cond-role', product.id, field.id), 'Definir Cargo Obrigatório', [
        textInput('roleId', 'ID DO CARGO OBRIGATÓRIO*', 'Insira o ID do cargo necessário para comprar'),
      ]));
    case 'cond-min':
      return interaction.showModal(modal(id('modal-cond-min', product.id, field.id), 'Definir Quantidade Mínima', [
        textInput('value', 'QUANTIDADE MÍNIMA DE COMPRA*', 'Insira a quantidade mínima de compra ex: 3 (und)', TextInputStyle.Short, true, field.minQty),
      ]));
    case 'cond-max':
      return interaction.showModal(modal(id('modal-cond-max', product.id, field.id), 'Definir Quantidade Máxima', [
        textInput('value', 'QUANTIDADE MÁXIMA DE COMPRA*', 'Insira a quantidade máxima de compra ex: 10 (und)', TextInputStyle.Short, true, field.maxQty),
      ]));
    case 'cond-min-remove':
      delete field.minQty;
      return sendOrUpdate(interaction, conditionsPanel(guild, product, field));
    case 'cond-max-remove':
      delete field.maxQty;
      return sendOrUpdate(interaction, conditionsPanel(guild, product, field));

    case 'stock': return sendOrUpdate(interaction, stockPanel(guild, product, field));
    case 'stock-add':
      return interaction.showModal(modal(id('modal-stock-add', product.id, field.id), `Adicionar estoque - ${field.name}`.slice(0, 45), [
        textInput('stock', 'ESTOQUE*', 'Cole os itens aqui, um abaixo do outro.', TextInputStyle.Paragraph),
        textInput('shuffle', 'EMBARALHAR?*', 'Sim ou Nao', TextInputStyle.Short, true, 'Nao'),
      ]));
    case 'stock-file':
      return interaction.reply({ content: 'Envie um arquivo `.txt` com um item por linha. No clone local, use **Adicionar** para colar o conteúdo do arquivo.', ephemeral: true });
    case 'stock-confirm': {
      const draft = userDraft(interaction.user.id).stockAdd;
      field.stock.push(...draft.items);
      field.lastRestock = Date.now();
      delete userDraft(interaction.user.id).stockAdd;
      await syncSaleMessage(guild, product);
      await notificarRestock(guild, gs, product, field, draft.items.length);
      await interaction.update(stockPanel(guild, product, field));
      return interaction.followUp({ content: renderCustomEmojis(`:yesgenesiss: | Estoque de **${field.name}** atualizado com sucesso!\n\`+ ${draft.items.length} itens adicionados + Estoque total: ${field.stock.length} itens\``), ephemeral: true });
    }
    case 'stock-delimiter':
      return interaction.showModal(modal(id('modal-stock-delimiter', product.id, field.id), 'Definir delimitador personalisado', [
        textInput('delimiter', 'DELIMITADOR', 'Insira o seu delimitador', TextInputStyle.Short, true, ','),
      ]));
    case 'stock-ghost':
      return interaction.showModal(modal(id('modal-stock-ghost', product.id, field.id), 'Adicionar estoque fantasma', [
        textInput('quantity', 'Quantidade*', 'Insira aqui a quantidade | Ex: 1000'),
        textInput('value', 'Valor fantasma*', 'Insira aqui um valor fantasma, ex: abra ticket para resgatar'),
      ]));
    case 'stock-infinite':
      if (field.infinite?.enabled) {
        field.infinite.enabled = false;
        await syncSaleMessage(guild, product);
        await interaction.update(stockPanel(guild, product, field));
        return interaction.followUp({ content: renderCustomEmojis(`:yesgenesiss: | Estoque infinito **desativado** para \`${field.name}\`.\n:infogenesiss: O estoque anterior de \`${stockCount(field)}\` itens foi restaurado.`), ephemeral: true });
      }
      return interaction.showModal(modal(id('modal-stock-infinite', product.id, field.id), 'Ativar Estoque Infinito', [
        textInput('text', 'Texto de entrega*', 'Ex: Abra um ticket para resgatar seu produto'),
      ]));
    case 'stock-remove':
      return sendOrUpdate(interaction, stockRemovePanel(guild, product, field));
    case 'stock-clear':
      field.stock = [];
      field.ghostStock = null;
      field.infinite = { enabled: false, text: '' };
      await syncSaleMessage(guild, product);
      return sendOrUpdate(interaction, fieldPanel(guild, product, field));
    case 'stock-view':
      if (field.infinite?.enabled) {
        return interaction.reply({ content: `${EMOJI.warning} | Este campo possui **estoque infinito** ativado.\n📝 **Texto de entrega:** \`${field.infinite.text}\``, ephemeral: true });
      }
      return interaction.reply({ content: field.stock.length ? field.stock.map((item, i) => `#${i + 1} ${item}`).join('\n') : `${EMOJI.no} | Nenhum item no estoque real.`, ephemeral: true });
    case 'instructions':
      return interaction.showModal(modal(id('modal-instructions', product.id, field.id), 'Definir Instruções do Campo', [
        textInput('enabled', 'Ativar instruções?*', 'Sim ou Não', TextInputStyle.Short, true, field.instructions?.enabled ? 'Sim' : 'Não'),
        textInput('description', 'Descrição das instruções*', 'Insira aqui as instruções do produto. (Aparecerá um botão na embed de entrega)', TextInputStyle.Paragraph, true, field.instructions?.description || ''),
      ]));

    case 'coupons': return sendOrUpdate(interaction, couponsPanel(guild, product));
    case 'coupon-new':
      return interaction.showModal(modal(id('modal-coupon-new', product.id), 'Criar cupom', [
        textInput('code', 'CÓDIGO*', 'Inisira um nome para esse cupom'),
        textInput('discount', 'DESCONTO*', 'Insira um desconto, exemplo para 10%: 10'),
        textInput('validity', 'VALIDADE - OPCIONAL', 'Quantos dias vai valer? Vazio = Infinito', TextInputStyle.Short, false),
      ]));
    case 'coupon-advanced':
      return interaction.showModal(modal(id('modal-coupon-advanced', product.id, b), 'Criar cupom etapa 2 (Opcional)', [
        textInput('maxUses', 'MÁXIMO DE USOS (POR PESSOA)', 'Insira uma quantidade limite de uso', TextInputStyle.Short, false),
        textInput('quantity', 'QUANTIDADE DE CUPONS', 'Insira uma quantidade limite de cupons', TextInputStyle.Short, false),
        textInput('requiredRole', 'CARGO NECESSÁRIO', 'ID do cargo necessário', TextInputStyle.Short, false),
        textInput('minQty', 'QUANTIDADE MÍNIMA (SE QUISER UM LIMITE)', 'Insira a quantia mínina de compra', TextInputStyle.Short, false),
        textInput('maxQty', 'QUANTIDADE MÁXIMA (SE QUISER UM LIMITE)', 'Insira a quantia máxima de compra', TextInputStyle.Short, false),
      ]));
    case 'coupon-remove':
      product.coupons.pop();
      return sendOrUpdate(interaction, couponsPanel(guild, product));

    case 'sell':
      return interaction.showModal(modal(id('modal-sell', product.id), 'Personalização Opcional', [
        textInput('emoji', 'EMOJI DO BOTÃO (opcional)', 'ID DO EMOJI | Padrão: 🛒', TextInputStyle.Short, false, EMOJI.carrinhoZend || '🛒'),
        textInput('label', 'TEXTO DO BOTÃO (opcional)', 'Insira aqui nome personalizado, ex: Comprar', TextInputStyle.Short, false, 'Comprar'),
        textInput('style', 'ESTILO DO BOTÃO (opcional)', 'Verde, Azul, Cinza ou Vermelho', TextInputStyle.Short, false, 'Verde'),
        textInput('color', 'COR DO EMBED (opcional)', 'Insira aqui um código Hex Color, ex: #FFFFFF', TextInputStyle.Short, false, '#FFFFFF'),
      ]));
    case 'buy':
      return startCart(interaction, gs, product);
    case 'buy-legacy':
      return startCart(interaction, gs, product);

    case 'ticket-open':
      return openTicket(interaction, gs, a || 'support');
    case 'ticket-open-force':
      return openTicket(interaction, gs, a || 'support', true);
    case 'ticket-open-cancel':
      return interaction.update({ content: '❌ | Abertura de ticket cancelada.', embeds: [], components: [], attachments: [] });
    case 'ticket-notify': {
      const ticket = gs.tickets.find((item) => item.id === a);
      if (!ticket) return interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
      ticket.updatedAt = Date.now();
      const member = await guild.members.fetch(ticket.userId).catch(() => null);
      const channel =
        (ticket.channelId && (await guild.channels.fetch(ticket.channelId).catch(() => null))) ||
        interaction.channel;

      const { embedTicketAtualizacao, componentesTicketAtualizacao } = await import(
        '../logs/embeds-cliente.js'
      );

      await member
        ?.send({
          embeds: [embedTicketAtualizacao({ guild, ticket, channel })],
          components: componentesTicketAtualizacao({ guild, channel }),
        })
        .catch(() => null);

      return interaction.reply({
        content: member
          ? `✅ | Notificação enviada com sucesso para <@${ticket.userId}>.`
          : '❌ | Não foi possível notificar o usuário.',
        ephemeral: true,
      });
    }
    case 'ticket-assume': {
      const ticket = gs.tickets.find((item) => item.id === a);
      if (!ticket) return interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
      if (!isCartAdmin(interaction, gs)) return interaction.reply({ content: '❌ | Apenas membros da equipe podem assumir tickets.', ephemeral: true });
      ticket.assignedTo = interaction.user.id;
      return interaction.reply({ content: `✅ | Ticket assumido por ${interaction.user}.`, ephemeral: true });
    }
    case 'ticket-close': {
      const ticket = gs.tickets.find((item) => item.id === a);
      if (!ticket) return interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
      if (!isCartAdmin(interaction, gs) && ticket.userId !== interaction.user.id) {
        return interaction.reply({ content: 'Você não pode encerrar este ticket.', ephemeral: true });
      }
      ticket.status = 'archived';
      ticket.closedAt = Date.now();
      ticket.closedBy = interaction.user.id;
      ticket.guildId = ticket.guildId || guild.id;
      ticket.functionId = ticket.functionId || a;

      const channel = interaction.channel;
      const {
        embedTicketEncerrado,
        componentesTicketEncerrado,
        montarTranscript,
      } = await import('../logs/embeds-cliente.js');

      // Transcript antes de apagar o canal
      const transcriptText = await montarTranscript(channel, ticket);
      ticket.transcriptContent = transcriptText;

      const owner = await guild.members.fetch(ticket.userId).catch(() => null);
      if (owner) {
        const fileName = `transcript-${String(ticket.id || 'ticket').slice(0, 12)}.txt`;
        const dmMsg = await owner
          .send({
            embeds: [
              embedTicketEncerrado({
                guild,
                ticket,
                closedByUser: interaction.user,
                member: owner,
              }),
            ],
            files: [
              {
                attachment: Buffer.from(transcriptText, 'utf8'),
                name: fileName,
              },
            ],
            // Botões sempre (Ver Transcript + Abrir Novamente)
            components: componentesTicketEncerrado({ guild, gs, ticket }),
          })
          .catch(() => null);

        // Se o Discord gerou URL do anexo, atualiza botão "Ver Transcript" para link
        const attachUrl = dmMsg?.attachments?.first?.()?.url;
        if (dmMsg && attachUrl) {
          ticket.transcriptUrl = attachUrl;
          await dmMsg
            .edit({
              components: componentesTicketEncerrado({
                guild,
                gs,
                ticket,
                transcriptUrl: attachUrl,
              }),
            })
            .catch(() => null);
        }
      }

      await interaction.reply({ content: '✅ | Ticket encerrado e salvo.', ephemeral: true });
      const exclusion = setTimeout(
        () => channel?.delete?.(`Ticket ${ticket.id} encerrado`).catch(() => null),
        5_000,
      );
      exclusion.unref?.();
      return;
    }
    case 'ticket-transcript': {
      const ticket = gs.tickets.find((item) => item.id === a);
      if (!ticket) {
        return interaction.reply({
          content: '❌ | Transcript não encontrado (ticket antigo ou já limpo).',
          ephemeral: true,
        });
      }
      if (ticket.transcriptUrl) {
        return interaction.reply({
          content: `📄 **Transcript:** ${ticket.transcriptUrl}`,
          ephemeral: true,
        });
      }
      const text = ticket.transcriptContent || 'Transcript vazio.';
      const fileName = `transcript-${String(ticket.id).slice(0, 12)}.txt`;
      if (text.length > 1800) {
        return interaction.reply({
          content: '📄 Transcript do ticket:',
          files: [{ attachment: Buffer.from(text, 'utf8'), name: fileName }],
          ephemeral: true,
        });
      }
      return interaction.reply({
        content: `📄 **Transcript**\n\`\`\`\n${text.slice(0, 1800)}\n\`\`\``,
        ephemeral: true,
      });
    }
    case 'ticket-reopen': {
      // a = functionId (pode vir da DM; interaction.guild pode ser null)
      if (!interaction.guild) {
        // Procura link do painel em qualquer guild do bot onde o user tenha ticket salvo
        const posted = gs?.ticket?.postedMessages?.[0];
        const anyTicket = (gs.tickets || []).find((t) => t.userId === interaction.user.id && t.guildId);
        const guildId = anyTicket?.guildId;
        if (guildId && posted?.channelId && posted?.messageId) {
          return interaction.reply({
            content: '🎫 Clique no link para abrir um ticket novamente:',
            components: [
              new ActionRowBuilder().addComponents(
                linkButton(
                  `https://discord.com/channels/${guildId}/${posted.channelId}/${posted.messageId}`,
                  'Abrir painel de tickets',
                  '🎫',
                ),
              ),
            ],
            ephemeral: true,
          });
        }
        return interaction.reply({
          content:
            '🎫 Entre no servidor e use o **painel de tickets** para abrir um novo atendimento.',
          ephemeral: true,
        });
      }
      const fn =
        gs.ticket.functions.find((item) => item.id === a) ||
        gs.ticket.functions.find((item) => item.name === a) ||
        gs.ticket.functions[0];
      if (!fn) {
        return interaction.reply({
          content:
            '❌ | Nenhuma categoria de ticket configurada. Peça à equipe para postar o painel.',
          ephemeral: true,
        });
      }
      return openTicket(interaction, gs, fn.id, true);
    }
    case 'delivery-copy': {
      // a = cart.id
      const cart = getCart(gs, a);
      const items = cart?.deliveredItems;
      if (!items?.length) {
        return interaction.reply({
          content: '❌ | Conteúdo da entrega não encontrado neste pedido.',
          ephemeral: true,
        });
      }
      const text = items.join('\n').slice(0, 1900);
      return interaction.reply({
        content: `📋 **Produto entregue** (copie abaixo):\n\`\`\`\n${text}\n\`\`\``,
        ephemeral: true,
      });
    }
    case 'delivery-restock': {
      // a = productId, b = fieldId
      if (!gs.roles?.notify && !gs.channels?.notify) {
        return interaction.reply({
          content:
            '🔔 Avisos de estoque ainda não estão configurados nesta loja. Peça para a equipe ativar o canal/cargo de notificação.',
          ephemeral: true,
        });
      }
      gs.restockWatch = gs.restockWatch || {};
      const key = `${a}:${b}`;
      const list = new Set(gs.restockWatch[key] || []);
      if (list.has(interaction.user.id)) {
        list.delete(interaction.user.id);
        gs.restockWatch[key] = [...list];
        return interaction.reply({
          content: '🔕 Você **não** será mais avisado sobre este estoque.',
          ephemeral: true,
        });
      }
      list.add(interaction.user.id);
      gs.restockWatch[key] = [...list];
      return interaction.reply({
        content: '🔔 Pronto! Você será avisado quando houver **atualização de estoque** deste produto.',
        ephemeral: true,
      });
    }
    case 'ticket-call': {
      const ticket = gs.tickets.find((item) => item.id === a);
      if (!ticket || !isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Apenas a equipe pode criar a call.', ephemeral: true });
      const voice = await guild.channels.create({
        name: `🔊・${interaction.user.username}・call`,
        type: ChannelType.GuildVoice,
        parent: interaction.channel?.parentId || undefined,
        permissionOverwrites: interaction.channel?.permissionOverwrites?.cache?.map((entry) => ({ id: entry.id, allow: entry.allow.bitfield, deny: entry.deny.bitfield })),
        reason: `Call do ticket ${ticket.id}`,
      }).catch(() => null);
      return interaction.reply({
        content: voice ? `✅ | Call criada com sucesso: ${voice}` : '❌ | Não foi possível criar a call.',
        components: voice ? [new ActionRowBuilder().addComponents(linkButton(`https://discord.com/channels/${guild.id}/${voice.id}`, 'Entrar na Call', '🔊'))] : [],
        ephemeral: true,
      });
    }
    case 'ticket-gank':
      if (!isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Apenas a equipe pode pedir gank.', ephemeral: true });
      if (!gs.roles.staff) return interaction.reply({ content: '❌ | Nenhum staff disponível encontrado para gank.', ephemeral: true });
      await interaction.channel?.send({ content: `<@&${gs.roles.staff}> ajuda solicitada por ${interaction.user}.` }).catch(() => null);
      return interaction.reply({ content: '✅ | Pedido de ajuda enviado.', ephemeral: true });
    case 'ticket-rename':
      return interaction.showModal(modal(id('modal-ticket-rename', a), 'Renomear Ticket', [
        textInput('name', 'Novo nome do ticket*', 'Digite o novo nome para o ticket'),
      ]));
    case 'ticket-member-add':
    case 'ticket-staff-add':
      return interaction.showModal(modal(id('modal-ticket-add-member', a || 'current'), 'Adicionar Participante', [
        textInput('userId', 'ID DO USUÁRIO*', 'Insira o ID do usuário'),
      ]));
    case 'ticket-preview': {
      const preview = ticketPreview(guild, gs);
      // V2 + ephemeral via flags combinados
      if (preview.flags) {
        const { MessageFlags } = await import('discord.js');
        preview.flags = Number(preview.flags) | MessageFlags.Ephemeral;
        delete preview.ephemeral;
        return interaction.reply(preview);
      }
      return interaction.reply({ ...preview, ephemeral: true });
    }
    case 'ticket-help':
      return interaction.reply({ embeds: [ticketHelpEmbed(guild)], ephemeral: true });
    case 'ticket-post':
      return interaction.reply({ content: 'Selecione o canal onde quer postar a mensagem.', components: [channelSelectRow(id('ticket-post-channel'))], ephemeral: true });
    case 'ticket-sync': {
      const { editarOuRepostar } = await import('../infraestrutura/resposta-painel.js');
      let ok = 0;
      let fail = 0;
      for (const posted of gs.ticket.postedMessages || []) {
        const channel = await guild.channels.fetch(posted.channelId).catch(() => null);
        const message = channel?.isTextBased()
          ? await channel.messages.fetch(posted.messageId).catch(() => null)
          : null;
        if (!message) {
          fail += 1;
          continue;
        }
        const updated = await editarOuRepostar(message, ticketOpeningPayload(guild, gs)).catch(
          () => null,
        );
        if (updated?.id) {
          posted.messageId = updated.id;
          posted.channelId = updated.channelId || posted.channelId;
          ok += 1;
        } else {
          fail += 1;
        }
      }
      return interaction.reply({
        content: `${EMOJI.yesgenesis} | Tickets sincronizados: \`${ok}\` ok${fail ? ` · \`${fail}\` falha` : ''}.`,
        ephemeral: true,
      });
    }
    case 'ticket-function-add':
      return interaction.showModal(modal(id('modal-ticket-function'), 'Adicionar Função', [
        textInput('name', 'NOME', 'Ex: Suporte'),
        textInput('preDescription', 'PRÉ DESCRIÇÃO', 'Ex: Preciso de suporte', TextInputStyle.Short, true),
        textInput('description', 'DESCRIÇÃO (OPCIONAL)', 'Aparece dentro do ticket após aberto', TextInputStyle.Paragraph, false),
        textInput('banner', 'BANNER (OPCIONAL)', 'URL de uma imagem ou GIF', TextInputStyle.Short, false),
        textInput('emoji', 'EMOJI', 'Emoji opcional', TextInputStyle.Short, false),
      ]));
    case 'ticket-functions':
      return sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
    case 'ticket-function-edit': {
      const fn = gs.ticket.functions.find((item) => item.id === a);
      if (!fn) return sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
      return interaction.showModal(modal(id('modal-ticket-function-edit', fn.id), 'Editar Função', [
        textInput('name', 'NOME*', 'Ex: Suporte', TextInputStyle.Short, true, fn.name),
        textInput('preDescription', 'PRÉ DESCRIÇÃO*', 'Ex: Preciso de suporte', TextInputStyle.Short, true, fn.preDescription || fn.description),
        textInput('description', 'DESCRIÇÃO (OPCIONAL)', 'Descrição completa', TextInputStyle.Paragraph, false, fn.description),
        textInput('banner', 'BANNER (OPCIONAL)', 'URL de uma imagem ou GIF', TextInputStyle.Short, false, fn.banner),
        textInput('emoji', 'EMOJI (OPCIONAL)', 'Emoji da função', TextInputStyle.Short, false, fn.emoji),
      ]));
    }
    case 'ticket-function-delete':
      gs.ticket.functions = gs.ticket.functions.filter((item) => item.id !== a);
      return sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
    case 'ticket-function-purchase': {
      const fn = gs.ticket.functions.find((item) => item.id === a);
      if (fn) fn.purchaseDetection = fn.purchaseDetection === false;
      return fn ? sendOrUpdate(interaction, ticketFunctionDetailPanel(guild, fn)) : sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
    }
    case 'ticket-mode-thread':
      gs.ticket.openMode = 'Thread Privada';
      return sendOrUpdate(interaction, ticketOpenModePanel(guild, gs));
    case 'ticket-mode-channel':
      gs.ticket.openMode = 'Canal Privado';
      return sendOrUpdate(interaction, ticketOpenModePanel(guild, gs));
    case 'ticket-hours-edit':
      return interaction.showModal(modal(id('modal-ticket-hours'), 'Configurar Horários', [
        textInput('mode', 'MODO*', '24 horas, bloquear ou avisar', TextInputStyle.Short, true, gs.ticket.hoursMode || '24 horas'),
        textInput('openAt', 'HORÁRIO INICIAL*', 'Ex: 08:00', TextInputStyle.Short, true, gs.ticket.openAt || '00:00'),
        textInput('closeAt', 'HORÁRIO FINAL*', 'Ex: 18:00', TextInputStyle.Short, true, gs.ticket.closeAt || '23:59'),
      ]));
    case 'ticket-hours-toggle':
      gs.ticket.hoursEnabled = !gs.ticket.hoursEnabled;
      return sendOrUpdate(interaction, ticketHoursPanel(guild, gs));
    case 'ticket-hours-outside':
      gs.ticket.allowOutsideHours = !gs.ticket.allowOutsideHours;
      return sendOrUpdate(interaction, ticketHoursPanel(guild, gs));
    case 'ticket-hours-all':
      for (const day of gs.ticket.hoursByDay) Object.assign(day, { active: true, openAt: '09:00', closeAt: '18:00' });
      gs.ticket.hoursEnabled = true;
      return sendOrUpdate(interaction, ticketHoursPanel(guild, gs));
    case 'ticket-hours-none':
      for (const day of gs.ticket.hoursByDay) day.active = false;
      return sendOrUpdate(interaction, ticketHoursPanel(guild, gs));
    case 'ticket-stats':
      return sendOrUpdate(interaction, ticketStatsPanel(guild, gs));
    case 'ticket-staff-archive':
      return interaction.reply({ content: 'Ticket arquivado pelo painel staff.', ephemeral: true });
    case 'ticket-staff-note':
      return interaction.showModal(modal(id('modal-ticket-note'), 'Adicionar observação ao ticket', [
        textInput('note', 'OBSERVAÇÃO*', 'Digite a observação interna', TextInputStyle.Paragraph),
      ]));

    case 'welcome-message':
      return interaction.showModal(modal(id('modal-welcome-message'), 'Editar Mensagem de Boas-Vindas', [
        textInput('message', 'MENSAGEM*', '{member} {username} {server} {membercount} {createdat} {accountage}', TextInputStyle.Paragraph, true, gs.welcome.message),
      ]));
    case 'welcome-autodelete':
      return interaction.showModal(modal(id('modal-welcome-autodelete'), 'Tempo para Auto-Deletar', [
        textInput('seconds', 'TEMPO EM SEGUNDOS (0 = NÃO DELETAR)*', 'Ex: 30, 60, 120... ou 0 para não deletar', TextInputStyle.Short, true, gs.welcome.autoDeleteSeconds),
      ]));
    case 'welcome-toggle-embed':
      gs.welcome.embed = !gs.welcome.embed;
      return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'welcome-toggle':
      gs.welcome.enabled = !gs.welcome.enabled;
      return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'welcome-image':
      return interaction.showModal(modal(id('modal-welcome-image'), 'Imagem', [
        textInput('url', 'URL DA IMAGEM', 'Insira uma URL de uma imagem ou gif', TextInputStyle.Short, false, gs.welcome.image),
      ]));
    case 'welcome-color':
      return interaction.showModal(modal(id('modal-welcome-color'), 'Alterar Cor', [
        textInput('color', 'COR HEX', 'Insira aqui um código Hex Color, ex: #FFFFFF', TextInputStyle.Short, true, gs.welcome.color),
      ]));
    case 'welcome-title':
      return interaction.showModal(modal(id('modal-welcome-title'), 'Título da Embed', [
        textInput('title', 'TÍTULO', 'Insira o título da embed', TextInputStyle.Short, true, gs.welcome.title),
      ]));
    case 'welcome-preview':
      if (gs.welcome.embed) {
        const preview = embed(gs.welcome.title || 'Bem-vindo(a)!', renderWelcome(gs.welcome.message, interaction.member), guild)
          .setColor(parseHex(gs.welcome.color));
        if (gs.welcome.image) preview.setImage(gs.welcome.image);
        return interaction.reply({ content: '👁️ Preview da mensagem de boas-vindas (Embed):', embeds: [preview], ephemeral: true });
      }
      return interaction.reply({ content: renderWelcome(gs.welcome.message, interaction.member), ephemeral: true });

    case 'auto-repost': return sendOrUpdate(interaction, repostPanel(guild, gs));
    case 'repost-time':
      return interaction.showModal(modal(id('modal-repost-time'), 'Definir Horário de Repostagem', [
        textInput('time', 'Horário (HH:MM)*', 'Ex: 14:30', TextInputStyle.Short, true, gs.automations.repost.time),
      ]));
    case 'repost-nuke':
      gs.automations.repost.nuke = !gs.automations.repost.nuke;
      return sendOrUpdate(interaction, repostPanel(guild, gs));
    case 'repost-toggle':
      gs.automations.repost.enabled = !gs.automations.repost.enabled;
      return sendOrUpdate(interaction, repostPanel(guild, gs));
    case 'repost-now':
      return interaction.reply({ content: `${EMOJI.yesgenesis} | Todos os produtos foram repostados.`, ephemeral: true });
    case 'auto-messages':
      return sendOrUpdate(interaction, painelMensagensAutomaticas(guild, gs));
    case 'auto-clean':
      return sendOrUpdate(interaction, painelLimpezaAutomatica(guild, gs));
    case 'auto-feedback':
      return sendOrUpdate(interaction, painelMonitorFeedbacks(guild, gs));
    case 'auto-lock':
      return sendOrUpdate(interaction, painelLockUnlock(guild, gs));
    case 'auto-invite':
      return sendOrUpdate(interaction, painelInviteTracker(guild, gs));
    case 'auto-restock':
      return sendOrUpdate(interaction, painelRestock(guild, gs));
      return sendOrUpdate(interaction, simplePanel(guild, 'Automação', 'Painel de configuração desta automação com status, canal, frequência e ações.', 'automations'));

    case 'automation-toggle':
      gs.automations[a].enabled = !gs.automations[a].enabled;
      return sendOrUpdate(interaction, automationFeaturePanel(guild, gs, a));
    case 'automation-config':
      return interaction.showModal(modal(id('modal-automation-config', a), `Configurar ${AUTOMATION_META[a].title}`, [
        textInput('value1', 'VALOR PRINCIPAL*', 'Mensagem, intervalo ou horário'),
        textInput('value2', 'VALOR SECUNDÁRIO', 'Opcional', TextInputStyle.Paragraph, false),
      ]));
    case 'automation-channel':
      return interaction.reply({ content: 'Selecione o canal desta automação.', components: [channelSelectRow(id('automation-channel-set', a))], ephemeral: true });
    case 'automation-preview':
      return interaction.reply({ content: `Preview da automação **${AUTOMATION_META[a].title}**.`, ephemeral: true });

    case 'giveaway-new':
      return interaction.showModal(modal(id('modal-giveaway-new'), '🎁 Criar Novo Sorteio - Informações Básicas', [
        textInput('title', 'Título do Sorteio*', 'Ex: Sorteio de 1000 Robux!'),
        textInput('description', 'Descrição do Sorteio*', 'Descreva o que está sendo sorteado...', TextInputStyle.Paragraph),
        textInput('winners', 'Número de Vencedores*', 'Ex: 1'),
      ]));
    case 'giveaway-manage':
      return sendOrUpdate(interaction, giveawayManagePanel(guild, gs));
    case 'giveaway-duration-manual':
      return interaction.showModal(modal(id('modal-giveaway-duration'), '🕘 Setar Tempo do Sorteio', [
        textInput('duration', 'Novo Tempo do Sorteio (a partir de agora)*', 'Ex: 30m, 1h, 2h, 1d'),
      ]));
    case 'giveaway-back-duration': {
      const draft = userDraft(interaction.user.id).giveaway;
      return sendOrUpdate(interaction, giveawayDurationPanel(guild, draft));
    }
    case 'giveaway-back-roles': {
      const draft = userDraft(interaction.user.id).giveaway;
      return sendOrUpdate(interaction, giveawayRolesPanel(guild, draft));
    }
    case 'giveaway-cancel-draft':
      delete userDraft(interaction.user.id).giveaway;
      return sendOrUpdate(interaction, giveawayPanel(guild, gs));
    case 'giveaway-roles-next': {
      const draft = userDraft(interaction.user.id).giveaway;
      return sendOrUpdate(interaction, giveawayExtrasPanel(guild, draft));
    }
    case 'giveaway-finish-setup': {
      const draft = userDraft(interaction.user.id).giveaway;
      if (!draft?.channelId || !draft.durationMs) return interaction.reply({ content: 'Defina a duração e o canal antes de finalizar.', ephemeral: true });
      const giveaway = {
        ...draft,
        id: crypto.randomUUID().slice(0, 12),
        status: 'active',
        createdAt: Date.now(),
        endAt: Date.now() + draft.durationMs,
        participants: [],
        messageId: null,
      };
      const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
      if (!channel?.isTextBased()) return interaction.reply({ content: 'Canal do sorteio não encontrado.', ephemeral: true });
      const message = await channel.send(giveawayMessagePayload(giveaway));
      giveaway.messageId = message.id;
      gs.giveaways.push(giveaway);
      delete userDraft(interaction.user.id).giveaway;
      scheduleGiveaway(guild, giveaway);
      return interaction.update({ content: `✅ | Sorteio criado com sucesso!`, embeds: [], components: [new ActionRowBuilder().addComponents(linkButton(message.url, 'Ir para o sorteio'))], attachments: [] });
    }
    case 'giveaway-enter': {
      const giveaway = gs.giveaways.find((item) => item.id === a);
      if (!giveaway || giveaway.status !== 'active') return interaction.reply({ content: 'Este sorteio já foi finalizado.', ephemeral: true });
      if (Date.now() >= giveaway.endAt) {
        await finishGiveaway(guild, giveaway);
        return interaction.reply({ content: 'Este sorteio acabou de ser finalizado.', ephemeral: true });
      }
      const roles = interaction.member?.roles?.cache;
      if (giveaway.blockedRoles?.some((roleId) => roles?.has(roleId))) return interaction.reply({ content: 'Você possui um cargo bloqueado neste sorteio.', ephemeral: true });
      if (giveaway.allowedRoles?.length && !giveaway.allowedRoles.some((roleId) => roles?.has(roleId))) return interaction.reply({ content: 'Você não possui um dos cargos necessários para participar.', ephemeral: true });
      if (giveaway.participants.some((item) => item.userId === interaction.user.id)) return interaction.reply({ content: 'Você já está participando deste sorteio.', ephemeral: true });
      const extras = Object.entries(giveaway.extraEntries || {}).reduce((sum, [roleId, amount]) => sum + (roles?.has(roleId) ? Number(amount) : 0), 0);
      giveaway.participants.push({ userId: interaction.user.id, entries: 1 + extras, joinedAt: Date.now() });
      await interaction.update(giveawayMessagePayload(giveaway));
      return interaction.followUp({ content: `✅ | Participação efetuada com **${1 + extras} entrada(s)**, boa sorte! 🎯`, ephemeral: true });
    }
    case 'giveaway-force':
      return interaction.showModal(modal(id('modal-giveaway-force', a), '⚠️ Confirmar Finalizamento Forçado', [
        textInput('confirmation', 'Digite "SIM" para finalizar o sorteio agora*', 'SIM'),
      ]));
    case 'giveaway-add-time':
      return interaction.showModal(modal(id('modal-giveaway-add-time', a), '🕘 Setar Tempo do Sorteio', [
        textInput('duration', 'Novo Tempo do Sorteio (a partir de agora)*', 'Ex: 30m, 1h, 2h, 1d'),
      ]));
    case 'giveaway-discontinue': {
      const giveaway = gs.giveaways.find((item) => item.id === a);
      if (giveaway) {
        giveaway.status = 'cancelled';
        giveaway.endedAt = Date.now();
        const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
        const message = channel?.isTextBased() ? await channel.messages.fetch(giveaway.messageId).catch(() => null) : null;
        if (message) await message.edit(giveawayMessagePayload(giveaway)).catch(() => null);
      }
      return sendOrUpdate(interaction, giveawayManagePanel(guild, gs));
    }
    case 'giveaway-participants': {
      const giveaway = gs.giveaways.find((item) => item.id === a);
      return interaction.reply({ content: `## Participantes do sorteio:\n${giveaway?.participants?.map((item, index) => `${index + 1}. <@${item.userId}> (${item.entries} entrada(s))`).join('\n') || 'Nenhum participante.'}`, ephemeral: true });
    }
    case 'giveaway-reroll': {
      const giveaway = gs.giveaways.find((item) => item.id === a);
      if (!giveaway || !isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Você não pode executar o reroll.', ephemeral: true });
      await finishGiveaway(guild, giveaway, true);
      return interaction.reply({ content: `✅ | Reroll realizado com sucesso! ${giveaway.winnerIds.length} vencedor(es) sorteado(s).`, ephemeral: true });
    }

    case 'channels-config': return sendOrUpdate(interaction, channelsPanel(guild, gs));
    case 'roles-config':
      return sendOrUpdate(interaction, rolesConfigPanel(guild, gs));
    case 'roles-manage':
      return sendOrUpdate(interaction, {
        embeds: [embed('Gerenciar cargos', 'Use o botão abaixo somente se deseja remover todas as definições de cargos do Zend.', guild)],
        components: [new ActionRowBuilder().addComponents(
          button(id('roles-reset-confirm'), 'Resetar todos', ButtonStyle.Danger, EMOJI.trash),
          button(id('roles-config'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
        )],
      });
    case 'roles-reset-confirm':
      gs.roles = { client: null, staff: null, manager: null, notify: null };
      return sendOrUpdate(interaction, rolesConfigPanel(guild, gs));
    case 'antifake':
      return sendOrUpdate(interaction, antiFakePanel(guild, gs));
    case 'antifake-toggle':
      gs.antiFake.enabled = !gs.antiFake.enabled;
      return sendOrUpdate(interaction, antiFakePanel(guild, gs));
    case 'antifake-config':
      return interaction.showModal(modal(id('modal-antifake'), 'Configurar Anti-Fake', [
        textInput('days', 'IDADE MÍNIMA DA CONTA (DIAS)*', 'Ex: 7', TextInputStyle.Short, true, gs.antiFake.minimumAccountDays),
        textInput('action', 'AÇÃO*', 'Registrar em log, expulsar ou bloquear', TextInputStyle.Short, true, gs.antiFake.action),
      ]));
    case 'role-config':
      return interaction.showModal(modal(id('modal-role-config', a), `Configurar cargo ${a}`, [
        textInput('roleId', 'ID DO CARGO*', 'Insira o ID do cargo'),
      ]));
    case 'channels-auto':
      {
        for (const [key, name] of Object.entries(CANAIS_AUTOMATICOS_ZEND)) {
          const current = gs.channels[key] ? await guild.channels.fetch(gs.channels[key]).catch(() => null) : null;
          if (current) continue;
          const created = await guild.channels.create({ name, type: ChannelType.GuildText, reason: 'Configuração automática do Zend' }).catch(() => null);
          if (created) gs.channels[key] = created.id;
        }
        return sendOrUpdate(interaction, channelsPanel(guild, gs));
      }
    case 'channels-reset':
      gs.channels = defaultGuildState().channels;
      return sendOrUpdate(interaction, channelsPanel(guild, gs));
      return sendOrUpdate(interaction, simplePanel(guild, 'Configurar Cargos', 'Configure cargo de cliente, staff, gerência e permissões usadas pelo bot.', 'settings'));
    case 'payments': return sendOrUpdate(interaction, paymentsPanel(guild, gs));
    case 'pay-manual': return sendOrUpdate(interaction, manualPaymentPanel(guild, gs));
    case 'pay-manual-toggle':
      gs.payments.manual.enabled = !gs.payments.manual.enabled;
      return sendOrUpdate(interaction, manualPaymentPanel(guild, gs));
    case 'pay-manual-edit':
      return interaction.showModal(modal(id('modal-pay-manual'), 'Configurar Pagamento Manual', [
        textInput('keyType', 'Tipo da chave PIX*', 'CPF, CNPJ, EMAIL, TELEFONE ou ALEATORIA', TextInputStyle.Short, true, gs.payments.manual.keyType),
        textInput('pixKey', 'CHAVE PIX*', 'Digite a chave conforme o tipo selecionado', TextInputStyle.Short, true, gs.payments.manual.pixKey),
        textInput('message', 'MENSAGEM APÓS REQUISIÇÃO DO PEDIDO*', 'Ex: após o pagamento, envie o comprovante aqui.', TextInputStyle.Paragraph, true, gs.payments.manual.message),
      ]));
    case 'pay-efi':
      return sendOrUpdate(interaction, gatewayPaymentPanel(guild, gs, 'efi'));
    case 'pay-mercado':
      return sendOrUpdate(interaction, gatewayPaymentPanel(guild, gs, 'mercadoPago'));
    case 'gateway-toggle':
      gs.payments[a].enabled = !gs.payments[a].enabled;
      return sendOrUpdate(interaction, gatewayPaymentPanel(guild, gs, a));
    case 'gateway-config': {
      const isEfi = a === 'efi';
      const item = gs.payments[a];
      return interaction.showModal(modal(id('modal-gateway', a), `Configurar ${isEfi ? 'Efí Bank' : 'Mercado Pago'}`, isEfi ? [
        textInput('clientId', 'CLIENT ID*', 'Client ID da aplicação', TextInputStyle.Short, true, item.clientId),
        textInput('clientSecret', 'CLIENT SECRET*', 'Client Secret da aplicação', TextInputStyle.Short, true, item.clientSecret),
        textInput('pixKey', 'CHAVE PIX*', 'Chave Pix recebedora', TextInputStyle.Short, true, item.pixKey),
        textInput('certificate', 'CERTIFICADO/PATH', 'Caminho local do certificado', TextInputStyle.Short, false, item.certificate),
      ] : [
        textInput('accessToken', 'ACCESS TOKEN*', 'Access token do Mercado Pago', TextInputStyle.Short, true, item.accessToken),
        textInput('publicKey', 'PUBLIC KEY', 'Public key da aplicação', TextInputStyle.Short, false, item.publicKey),
      ]));
    }
    case 'pay-zenwallet':
      return sendOrUpdate(interaction, zenWalletPanel(guild, gs));

    case 'zenwallet-toggle':
      gs.payments.zenWallet.enabled = !gs.payments.zenWallet.enabled;
      return sendOrUpdate(interaction, zenWalletPanel(guild, gs));
    case 'zenwallet-register':
      return sendOrUpdate(interaction, {
        embeds: [
          embed(
            'Oops!',
            [
              'Para utilizar o zenWallet, é necessário ter um email cadastrado na Zend.',
              '',
              '1° Acesse o painel de gerenciamento de aplicação na zend e cadastre seu email para poder usar esta funcionalidade.',
              '2° Veja suas aplicações > Outras configurações > Segurança > Alterar email de recuperação.',
              '',
              'Após cadastrar o email, tente novamente.',
            ].join('\n'),
            guild,
          ),
        ],
      });
    case 'zenwallet-info':
      return interaction.reply({ content: 'zenWallet é uma carteira digital automatizada para receber PIX, acumular saldo e sacar valores.', ephemeral: true });
    case 'zenwallet-gateway':
      return interaction.reply({ content: 'Gateway ativo: `PagC`.', ephemeral: true });
    case 'zenwallet-balance':
      return interaction.reply({ content: `Saldo disponível: \`${money(Object.values(gs.balance.users).reduce((sum, user) => sum + Number(user.balance || 0), 0))}\`.`, ephemeral: true });
    case 'zenwallet-consult':
      return interaction.showModal(modal(id('modal-zenwallet-consult'), 'Consultar pagamento zenWallet', [
        textInput('paymentId', 'ID DO PAGAMENTO*', 'Insira o ID do pagamento'),
      ]));

    case 'cloud-oauth': return sendOrUpdate(interaction, oauthPanel(guild, gs));
    case 'oauth-register':
      return interaction.showModal(modal(id('modal-oauth-register'), 'Registrar aplicação OAuth2', [
        textInput('token', 'TOKEN DA APLICAÇÃO*', 'Insira o token da sua aplicação Discord'),
        textInput('secret', 'CLIENT SECRET*', 'Insira o client secret da sua aplicação Discord'),
      ]));

    case 'custom-colors-edit':
      return interaction.showModal(modal(id('modal-custom-colors'), 'Editar cores das embeds', [
        textInput('default', 'COR PADRÃO*', '#2b2d31', TextInputStyle.Short, true, gs.customization.colors.default),
        textInput('success', 'COR DE SUCESSO*', '#22C55E', TextInputStyle.Short, true, gs.customization.colors.success),
        textInput('error', 'COR DE ERRO*', '#EF4444', TextInputStyle.Short, true, gs.customization.colors.error),
      ]));
    case 'custom-colors-reset':
      gs.customization.colors = { ...TEMAS_CORES_ZEND.zend };
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'colors'));
    case 'custom-bot-edit':
      return interaction.showModal(modal(id('modal-custom-bot'), 'Personalizar Bot', [
        textInput('nickname', 'NICKNAME', 'Nome do bot no servidor', TextInputStyle.Short, false, gs.customization.bot.nickname),
        textInput('avatar', 'URL DO AVATAR', 'URL da imagem', TextInputStyle.Short, false, gs.customization.bot.avatar),
        textInput('banner', 'URL DO BANNER', 'URL da imagem', TextInputStyle.Short, false, gs.customization.bot.banner),
        textInput('status', 'STATUS', 'Online, Ausente, Ocupado...', TextInputStyle.Short, false, gs.customization.bot.status),
      ]));
    case 'custom-brand-edit':
      return interaction.showModal(modal(id('modal-custom-brand'), 'Marca - QR Code', [
        textInput('qrLogo', 'URL DA LOGO', 'Logo aplicada ao QR Code', TextInputStyle.Short, false, gs.customization.brand.qrLogo),
        textInput('qrColor', 'COR DO QR CODE', '#111827', TextInputStyle.Short, true, gs.customization.brand.qrColor),
      ]));
    case 'custom-public-toggle':
      gs.customization.publicLog.enabled = !gs.customization.publicLog.enabled;
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'public-log'));
    case 'custom-public-v2':
      gs.customization.publicLog.v2 = !gs.customization.publicLog.v2;
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'public-log'));
    case 'custom-public-image':
      return interaction.showModal(modal(id('modal-custom-public-image'), 'Imagem da log pública', [
        textInput('image', 'URL DA IMAGEM', 'Imagem da log pública de entregas', TextInputStyle.Short, false, gs.customization.publicLog.image),
      ]));
    case 'custom-public-preview':
      {
        const preview = embed(
          '🛍️ Entrega Realizada!',
          `O usuário **${interaction.user.username}** teve seu pedido entregue.\n\n**Carrinho**\n\`1x Produto Exemplo - Campo\`\n\n**Valor pago**\n\`R$ 19,90\``,
          guild,
          'Preview da log pública',
        ).setColor(parseHex(gs.customization.colors.success));
        if (gs.customization.publicLog.image) preview.setImage(gs.customization.publicLog.image);
        const actions = [];
        if (gs.customization.publicLog.showBuy) actions.push(button(id('custom-public-preview-noop', 'buy'), 'Comprar novamente', ButtonStyle.Success, EMOJI.carrinhoZend, true));
        if (gs.customization.publicLog.showFeedback) actions.push(button(id('custom-public-preview-noop', 'feedback'), 'Feedbacks', ButtonStyle.Secondary, '🏆', true));
        return interaction.reply({ embeds: [preview], components: actions.length ? [new ActionRowBuilder().addComponents(...actions)] : [], ephemeral: true });
      }
    case 'custom-feedback-edit':
      return interaction.showModal(modal(id('modal-custom-feedback'), 'Mensagem de Feedback (DM)', [
        textInput('message', 'MENSAGEM ({saudacao} e {usuario})*', 'Mensagem enviada na DM após compra', TextInputStyle.Paragraph, true, gs.customization.feedbackDm.message),
      ]));
    case 'custom-feedback-button':
      return interaction.showModal(modal(id('modal-custom-feedback-button'), 'Editar Texto do Botão', [
        textInput('buttonText', 'TEXTO DO BOTÃO DE FEEDBACK*', 'Clique aqui e deixe seu feedback ;)', TextInputStyle.Short, true, gs.customization.feedbackDm.buttonText),
      ]));
    case 'custom-feedback-reset':
      gs.customization.feedbackDm = { ...defaultGuildState().customization.feedbackDm };
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'feedback-dm'));
    case 'custom-feedback-preview':
      return interaction.reply({
        content: renderFeedback(gs.customization.feedbackDm.message, interaction.user),
        components: gs.channels.feedback
          ? [new ActionRowBuilder().addComponents(linkButton(`https://discord.com/channels/${guild.id}/${gs.channels.feedback}`, gs.customization.feedbackDm.buttonText))]
          : [],
        ephemeral: true,
      });
    case 'custom-product-v2':
      gs.customization.productMessages.v2 = !gs.customization.productMessages.v2;
      // Re-sincroniza mensagens de venda no novo modo (Embed ↔ V2)
      for (const product of gs.products || []) {
        if (product.salesMessage) {
          await syncSaleMessage(guild, product).catch(() => null);
        }
      }
      for (const item of gs.products) await syncSaleMessage(guild, item);
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'product-v2'));
    case 'custom-product-repost':
      for (const item of gs.products) await syncSaleMessage(guild, item);
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'product-v2'));
    case 'custom-product-color':
      return interaction.showModal(modal(id('modal-custom-product-color'), 'Cor lateral das mensagens', [
        textInput('color', 'COR HEX (VAZIO DESATIVA)', 'Ex: #FFFFFF', TextInputStyle.Short, false, gs.customization.productMessages.sideColor),
      ]));

    case 'statement-period':
      return sendOrUpdate(interaction, statementPeriodPanel(guild, gs, a));
    case 'statement-chart':
      return sendOrUpdate(interaction, statementChartPanel(guild, gs));
    case 'statement-history':
      return sendOrUpdate(interaction, statementHistoryPanel(guild, gs));
    case 'statement-reset':
      gs.stats = { salesToday: 0, salesTotal: 0, countToday: 0, countTotal: 0 };
      return sendOrUpdate(interaction, statementPanel(guild, gs, interaction.user));
    case 'protect-toggle':
      gs.protect[a] = !gs.protect[a];
      return sendOrUpdate(interaction, protectDetailPanel(guild, gs, a === 'antiraid' ? 'antiraid' : 'moderation'));
    case 'protect-moderation':
      return sendOrUpdate(interaction, protectDetailPanel(guild, gs, 'moderation'));
    case 'protect-selfbot':
      return sendOrUpdate(interaction, protectSelfBotPanel(guild, gs));
    case 'protect-antiinvite':
      return sendOrUpdate(interaction, protectAntiInvitePanel(guild, gs));
    case 'protect-selfbot-toggle':
      gs.protect.selfBot.enabled = !gs.protect.selfBot.enabled;
      return sendOrUpdate(interaction, protectSelfBotPanel(guild, gs));
    case 'protect-antiinvite-toggle':
      gs.protect.antiInvite.enabled = !gs.protect.antiInvite.enabled;
      return sendOrUpdate(interaction, protectAntiInvitePanel(guild, gs));
    case 'protect-selfbot-channel':
      return sendOrUpdate(interaction, protectChannelSelectionPanel(guild, gs, 'selfbot'));
    case 'protect-antiinvite-channel':
      return sendOrUpdate(interaction, protectChannelSelectionPanel(guild, gs, 'antiinvite'));
    case 'protect-selfbot-limit':
      return interaction.showModal(modal(id('modal-protect-selfbot-limit'), 'Ajustar limite', [
        textInput('limit', 'LIMITE DE IMAGENS/ANEXOS*', 'Ex: 4', TextInputStyle.Short, true, gs.protect.selfBot.limit),
      ]));
    case 'protect-antiinvite-whitelist':
      return sendOrUpdate(interaction, protectWhitelistPanel(guild, gs));
    case 'protect-log':
      return interaction.reply({ content: 'Selecione o canal de logs do zenProtect.', components: [channelSelectRow(id('protect-log-channel'))], ephemeral: true });
    case 'protect-raid-config':
      return interaction.showModal(modal(id('modal-protect-raid'), 'Configurar Anti-Raid', [
        textInput('limit', 'LIMITE DE ENTRADAS*', 'Ex: 8', TextInputStyle.Short, true, gs.protect.raidLimit),
        textInput('seconds', 'JANELA EM SEGUNDOS*', 'Ex: 10', TextInputStyle.Short, true, gs.protect.raidWindowSeconds),
        textInput('punishment', 'PUNIÇÃO*', 'Ex: Bloquear entradas temporariamente', TextInputStyle.Short, true, gs.protect.raidPunishment),
      ]));
    case 'stock-request-open':
      return interaction.showModal(modal(id('modal-stock-request'), 'Solicitar estoque', [
        textInput('product', 'PRODUTO*', 'Nome do produto desejado'),
        textInput('quantity', 'QUANTIDADE', 'Opcional', TextInputStyle.Short, false),
      ]));
    case 'oauth-config':
      return sendOrUpdate(interaction, oauthConfigPanel(guild, gs));
    case 'oauth-server-id':
      return interaction.showModal(modal(id('modal-oauth-server-id'), 'Configurar ID do Servidor', [
        textInput('serverId', 'ID do Servidor*', 'Ex: 1234567890123456789', TextInputStyle.Short, true, gs.cloud.serverId),
      ]));
    case 'oauth-role':
      return sendOrUpdate(interaction, oauthRolePanel(guild, gs));
    case 'oauth-webhook':
      return interaction.showModal(modal(id('modal-oauth-webhook'), 'Configurar Webhook', [
        textInput('webhookUrl', 'URL do Webhook*', 'Ex: https://discord.com/api/webhooks/...', TextInputStyle.Paragraph, true),
      ]));
    case 'oauth-verify': {
      const issues = [];
      if (!gs.cloud.serverId) issues.push('❌ **ID do Servidor** — Não configurado.');
      if (!gs.cloud.verifiedRoleId) issues.push('❌ **Cargo Verificado** — Não configurado.');
      if (!gs.cloud.webhookUrl) issues.push('❌ **Webhook** — Não configurado.');
      return interaction.reply({
        embeds: [embed(
          '🛡️ Verificação de Status OAuth2',
          issues.length ? `**Problemas Encontrados**\n\n${issues.join('\n')}` : '✅ Configuração completa. Os três campos obrigatórios estão definidos.',
          guild,
        ).setColor(issues.length ? 0xff0000 : 0x39fc03)],
        ephemeral: true,
      });
    }
    case 'oauth-recover':
      return interaction.showModal(modal(id('modal-oauth-recover'), 'Recuperar membros do servidor', [
        textInput('serverId', 'ID do Servidor*', 'Insira o ID do servidor para puxar os membros', TextInputStyle.Short, true, gs.cloud.serverId),
        textInput('limit', 'Limite de Membros', 'Deixe vazio para puxar todos os membros', TextInputStyle.Short, false),
      ]));
    case 'oauth-link':
      return interaction.reply({ content: 'Link OAuth2: https://zendapplications.com.br/oauth2/callback', ephemeral: true });
    case 'oauth-reset':
      gs.cloud.linked = false;
      gs.cloud.syncedMembers = null;
      gs.cloud.serverId = null;
      gs.cloud.verifiedRoleId = null;
      gs.cloud.webhookUrl = null;
      return sendOrUpdate(interaction, oauthPanel(guild, gs));

    default:
      return interaction.reply({ content: 'Esta ação não está disponível neste estado do painel.', ephemeral: true });
  }
}
}
