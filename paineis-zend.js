// Paineis e mensagens visuais do Zend clonando.
// Tudo que monta embed, botao, select ou mensagem visual fica aqui.
// Branding: Flow Vazamentos · .gg/flowvazamentos (src/infraestrutura/creditos.js)

import { CREDIT_INVITE, CREDIT_TAG, garantirCreditos } from '../infraestrutura/creditos.js';
// Integridade do crédito (boot do módulo de painéis)
garantirCreditos();

export function criarPaineisZend(contexto) {
  const {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    ContainerBuilder,
    EmbedBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    PermissionFlagsBits,
    RoleSelectMenuBuilder,
    SeparatorBuilder,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
    TextInputStyle,
    ASSETS,
    CANAIS_AUTOMATICOS_ZEND,
    EMOJI,
    EXTENSOES_EMOJI_ZEND,
    PASTA_EMOJIS_ZEND,
    POSITION_EMOJIS,
    POSITION_LIMIT,
    TEMAS_CORES_ZEND,
    button,
    createCanvas,
    embed,
    existsSync,
    fs,
    id,
    linkButton,
    localAsset,
    modal,
    money,
    nowFooter,
    parseHex,
    path,
    renderCustomEmojis,
    renderWelcome,
    rows,
    saveState,
    sendConfiguredLog,
    syncedEmojiOptions,
    textInput,
  } = contexto;

function mainPanel(guild) {
  const banner = localAsset(ASSETS.mainBannerFile);
  const payload = {
    embeds: [],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('store'), 'Minha loja', ButtonStyle.Success, EMOJI.store),
        button(id('ticket'), 'Ticket', ButtonStyle.Primary, EMOJI.support),
        button(id('welcome'), 'Boas-Vindas', ButtonStyle.Primary, EMOJI.welcome),
        button(id('automations'), 'Automações', ButtonStyle.Primary, EMOJI.refresh),
      ),
      new ActionRowBuilder().addComponents(
        button(id('custom'), 'Customizar', ButtonStyle.Primary, EMOJI.roller),
        button(id('cloud'), 'zenCloud', ButtonStyle.Primary, EMOJI.cloud),
        button(id('statement'), 'Extrato', ButtonStyle.Success, EMOJI.receipt),
        button(id('giveaway'), 'Giveaway', ButtonStyle.Success, EMOJI.celebration),
      ),
      new ActionRowBuilder().addComponents(
        button(id('settings'), 'Configurações', ButtonStyle.Secondary, EMOJI.settings),
        button(id('protect'), 'zenProtect', ButtonStyle.Secondary, EMOJI.secured),
      ),
    ],
  };

  // Imagem solta (attachment), sem embed
  if (banner) {
    payload.files = [banner];
  }

  return payload;
}

function productListPanel(guild, gs) {
  if (!gs.products.length) {
    return {
      content: 'Não há produtos criados no momento, Dê /panel e crie seu primeiro produto!',
      embeds: [],
      components: [new ActionRowBuilder().addComponents(button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left))],
    };
  }
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('product-select'))
    .setPlaceholder(`[${Math.min(gs.products.length, 25)}] Clique aqui para selecionar`)
    .addOptions(
      gs.products.slice(0, 25).map((product) => ({
        label: product.name.slice(0, 100),
        description: (product.description || 'Não definido').slice(0, 100),
        value: product.id,
      })),
    );
  return {
    content: 'Qual produto deseja gerenciar?',
    embeds: [],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        button(id('out-of-stock'), 'Produtos s/ estoque', ButtonStyle.Secondary, EMOJI.stock),
        button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function storePanel(guild, gs, user) {
  const efi = gs.payments.efi.enabled && gs.payments.efi.configured ? '🟢 Configurado' : '🔴 Não configurado';
  const e = embed(
    'zenSallers\nPainel da Loja',
    [
      `Senhor(a) ${user?.username || 'senhor'}, escolha o que deseja fazer.`,
      `**Total criados**\n\`${gs.products.length}x Produtos\``,
      `**Saldo (Efí Bank)**\n\`${efi}\``,
      `**Moeda Padrão**\n\`${gs.currency}\` - \`${gs.locale}\``,
    ].join('\n'),
    guild,
  );
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('store-more'))
    .setPlaceholder('↪ Mais opções da loja...')
    .addOptions(
      { label: 'Posições', description: 'Cargos por valor gasto.', value: 'positions', emoji: '👥' },
      { label: 'Sistema de Saldo', description: 'Configure o sistema de saldo interno da loja.', value: 'balance', emoji: '👛' },
      { label: 'Cupons', description: 'Crie e gerencie cupons de desconto.', value: 'coupons', emoji: '🎟️' },
      { label: 'Condecorações', description: 'Configure condecorações por metas de compra.', value: 'badges', emoji: '🏆' },
      { label: 'Cargo Temporário', description: 'Cargos temporários vinculados a produtos.', value: 'temp-role', emoji: '✨' },
      { label: 'OAuth2 *', description: 'Configure a obrigatoriedade de auth via OAuth2 para compras.', value: 'oauth2', emoji: '☁️' },
    );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('product-new'), 'Criar produto', ButtonStyle.Success, EMOJI.plus),
        button(id('products'), 'Produtos', ButtonStyle.Primary, EMOJI.title),
      ),
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function positionsPanel(guild, gs) {
  const positions = gs.positions.slice(0, POSITION_LIMIT);
  const body = positions
    .map((pos, index) => `**${POSITION_EMOJIS[index] || '🏅'} ${pos.index}ª Posição** — ${pos.roleId ? `<@&${pos.roleId}>${pos.amount ? ` • ${money(pos.amount)}` : ''}` : ':genesisNoC: Não configurada'}`)
    .join('\n');
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('position-select'))
    .setPlaceholder('📋 Selecione uma posição para configurar')
    .addOptions(
      positions.map((pos, index) => ({
        label: `${pos.index}ª Posição`,
        description: pos.roleId ? `Cargo configurado: ${pos.roleId}` : 'Clique para configurar',
        value: String(pos.index),
        emoji: POSITION_EMOJIS[index],
      })),
    );
  return {
    embeds: [embed('zenSallers\n:zendTrofeu: Sistema de Posições', `:infogenesiss: As posições são cargos que os clientes recebem automaticamente ao atingir uma quantia gasta no servidor.\n\n${body}`, guild, 'Selecione uma posição para configurar')],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function positionPanel(guild, gs, index) {
  const pos = gs.positions[index - 1];
  const label = `${POSITION_EMOJIS[index - 1] || '🏅'} Configurar ${index}ª Posição`;
  return {
    embeds: [
      embed(
        `zenSallers\n${label}`,
        [
          pos.roleId
            ? `Cargo configurado: <@&${pos.roleId}>${pos.amount ? ` ao atingir ${money(pos.amount)}` : ''}.`
            : ':infogenesiss: Esta posição ainda não está configurada. Selecione um cargo abaixo para configurar.',
          '',
          `**Cargo:** ${pos.roleId ? `<@&${pos.roleId}>` : '`Não configurado`'}`,
          `**Valor gasto:** \`${pos.amount ? money(pos.amount) : 'Não definido'}\``,
          `**Posição:** \`${index}/${POSITION_LIMIT}\``,
        ].join('\n'),
        guild,
        'Etapa 1 de 2 • Selecione o cargo',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(id('position-role-select', String(index)))
          .setPlaceholder(`Selecione o cargo para ${index}ª Posição`)
          .setMinValues(1)
          .setMaxValues(1),
      ),
      new ActionRowBuilder().addComponents(
        button(id('position-set', String(index)), 'Inserir ID', ButtonStyle.Secondary, EMOJI.title),
        button(id('position-remove', String(index)), '🗑️ Remover posição', ButtonStyle.Danger, undefined, !pos.roleId),
      ),
      new ActionRowBuilder().addComponents(button(id('positions'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function balancePanel(guild, gs) {
  const users = Object.values(gs.balance.users || {});
  const total = users.reduce((sum, user) => sum + Number(user.balance || 0), 0);
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('balance-menu'))
    .setPlaceholder('Selecione uma ação para gerenciar saldos')
    .addOptions(
      { label: 'Adicionar Saldo', description: 'Adicionar créditos a um usuário', value: 'add', emoji: '➕' },
      { label: 'Remover Saldo', description: 'Remover créditos de um usuário', value: 'remove', emoji: '➖' },
      { label: 'Definir Saldo', description: 'Definir o saldo exato de um usuário', value: 'set', emoji: '💰' },
      { label: 'Consultar Usuário', description: 'Ver saldo e histórico de um usuário', value: 'get', emoji: '🔎' },
      { label: 'Ver Todos os Usuários', description: 'Lista completa de usuários com saldo', value: 'all', emoji: '📋' },
    );
  return {
    embeds: [
      embed(
        'zenSallers\nSistema de Saldo',
        [
          `**Status:** \`${gs.balance.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
          `**Usuários com saldo:** \`${users.length}\``,
          `**Saldo total interno:** \`${money(total)}\``,
          `**Histórico:** \`${gs.balance.history.length} movimentações\``,
          '',
          'O painel público de recarga fica disponível quando o sistema está habilitado.',
        ].join('\n'),
        guild,
        'Saldo interno',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        button(id('balance-toggle'), gs.balance.enabled ? 'Desabilitar Sistema' : 'Habilitar Sistema', gs.balance.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('balance-post'), 'Postar painel de recarga', ButtonStyle.Secondary, EMOJI.wallet, !gs.balance.enabled),
      ),
      new ActionRowBuilder().addComponents(button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function storeCouponsPanel(guild, gs) {
  const totalCoupons = gs.products.reduce((sum, product) => sum + (product.coupons?.length || 0), 0);
  return {
    embeds: [
      embed(
        'zenSallers\nCupons',
        [
          'Crie cupons em massa para todos os produtos ou remova cupons criados em massa.',
          `**Produtos:** \`${gs.products.length}\``,
          `**Cupons existentes:** \`${totalCoupons}\``,
          '',
          'Para cupons de um produto específico, abra **Produtos > Gerenciar cupons**.',
        ].join('\n'),
        guild,
        'Cupons',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('coupon-create'), 'Criar Cupom', ButtonStyle.Secondary, EMOJI.plus),
        button(id('mass-coupon-create'), 'Criar em Massa', ButtonStyle.Secondary, EMOJI.coupon),
        button(id('coupon-list'), 'Ver Cupons', ButtonStyle.Secondary, EMOJI.visible),
      ),
      new ActionRowBuilder().addComponents(
        button(id('coupon-by-product'), 'Por Produto', ButtonStyle.Secondary, EMOJI.title),
        button(id('coupon-expired'), 'Expirados', ButtonStyle.Secondary, EMOJI.clock),
        button(id('coupon-help'), 'Ajuda', ButtonStyle.Secondary, EMOJI.warning),
      ),
      new ActionRowBuilder().addComponents(button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function badgesPanel(guild, gs) {
  const body = gs.badges.length
    ? gs.badges.map((badge, index) => `\`${index + 1}.\` ${badge.emoji || '🏆'} **${badge.name}** - meta ${money(badge.amount)}${badge.roleId ? ` - <@&${badge.roleId}>` : ''}`).join('\n')
    : '`Nenhuma condecoração configurada.`';
  return {
    embeds: [
      embed(
        'zenSallers\nCondecorações',
        [
          'Configure condecorações por metas de compra. Elas aparecem no perfil do cliente e podem ser recalculadas pelos comandos de condecoração.',
          `**Status:** \`${gs.badgeSettings.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
          `**Notificação DM:** \`${gs.badgeSettings.dm ? 'Ativada' : 'Desativada'}\``,
          `**Anúncios:** \`${gs.badgeSettings.announcements ? 'Ativados' : 'Desativados'}\``,
          '',
          body,
        ].join('\n'),
        guild,
        'Condecorações',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('badge-toggle'), gs.badgeSettings.enabled ? 'Desabilitar' : 'Habilitar', gs.badgeSettings.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.syncGreen),
        button(id('badge-dm'), `Notificação DM: ${gs.badgeSettings.dm ? 'ON' : 'OFF'}`, ButtonStyle.Secondary, EMOJI.forum),
        button(id('badge-announcements'), `Anúncios: ${gs.badgeSettings.announcements ? 'ON' : 'OFF'}`, ButtonStyle.Secondary, EMOJI.activity),
      ),
      new ActionRowBuilder().addComponents(
        button(id('badge-channel'), 'Canal de Anúncios', ButtonStyle.Secondary, EMOJI.textChannel),
        button(id('badge-edit'), 'Editação', ButtonStyle.Secondary, EMOJI.edit),
        button(id('badge-display'), 'Exibição', ButtonStyle.Secondary, EMOJI.visible),
      ),
      new ActionRowBuilder().addComponents(button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function tempRolePanel(guild, gs) {
  const body = gs.tempRoles.length
    ? gs.tempRoles.map((item, index) => `\`${index + 1}.\` Produto \`${item.productName}\` entrega <@&${item.roleId}> por \`${item.days} dias\``).join('\n')
    : '`Nenhum cargo temporário vinculado a produto.`';
  return {
    embeds: [
      embed(
        'zenSallers\nCargo Temporário',
        [
          'Vincule cargos temporários a produtos/campos para entregar acesso por tempo limitado após a compra.',
          `**Status:** \`${gs.tempRoleSettings.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
          '',
          body,
        ].join('\n'),
        guild,
        'Cargo Temporário',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('temp-role-toggle'), gs.tempRoleSettings.enabled ? 'Desativar Sistema' : 'Ativar Sistema', gs.tempRoleSettings.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.syncGreen),
        button(id('temp-role-new'), 'Vincular Produto', ButtonStyle.Secondary, EMOJI.role),
        button(id('temp-role-products'), 'Produtos', ButtonStyle.Secondary, EMOJI.title),
      ),
      new ActionRowBuilder().addComponents(
        button(id('temp-role-members'), 'Ver Membros', ButtonStyle.Secondary, EMOJI.users),
        button(id('temp-role-config'), 'Configurações', ButtonStyle.Secondary, EMOJI.settings),
        button(id('temp-role-manual'), 'Adicionar Manual', ButtonStyle.Secondary, EMOJI.plus),
      ),
      new ActionRowBuilder().addComponents(
        button(id('temp-role-help'), 'Como Funciona', ButtonStyle.Secondary, EMOJI.warning),
        button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function storeOauthPanel(guild, gs) {
  return {
    embeds: [
      embed(
        'zenSallers\nOAuth2 para compras',
        [
          'Configure a obrigatoriedade de autenticação OAuth2 antes de finalizar compras.',
          `**Obrigatório nas compras:** \`${gs.storeOauth.required ? '🟢 Sim' : '🔴 Não'}\``,
          `**Aplicação zenCloud:** \`${gs.cloud.linked ? '🟢 Vinculada' : '🔴 Não vinculada'}\``,
          '',
          'Use **zenCloud > Gerenciar OAuth2** para registrar a aplicação, client secret e link de autorização.',
        ].join('\n'),
        guild,
        'OAuth2',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('store-oauth-toggle'), gs.storeOauth.required ? 'Desabilitar sistema' : 'Habilitar sistema', ButtonStyle.Success, EMOJI.syncGreen, true),
        button(id('store-oauth-disable-tickets'), 'Desabilitar tickets', ButtonStyle.Danger, EMOJI.syncGreen, true),
        button(id('store-oauth-disable-carts'), 'Desabilitar carrinhos', ButtonStyle.Danger, EMOJI.syncGreen, true),
      ),
      new ActionRowBuilder().addComponents(
        button(id('cloud-oauth'), 'Vincular OAuth2', ButtonStyle.Primary, EMOJI.upload),
        button(id('store-oauth-refresh-link'), 'Atualizar auth link', ButtonStyle.Primary, EMOJI.url, true),
        button(id('store-oauth-text'), 'Editar texto', ButtonStyle.Primary, EMOJI.title, true),
      ),
      new ActionRowBuilder().addComponents(
        button(id('store-oauth-preview'), 'Visualizar mensagem', ButtonStyle.Secondary, EMOJI.visible, true),
        button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function draftProductPanel(guild, draft) {
  const e = embed(
    `zenSallers\nCriando novo produto \`${draft.name}\``,
    [
      `${EMOJI.warning} Configure as opções do produto abaixo.`,
      `${EMOJI.seta} Clique nos botões para definir cada configuração.`,
      `${EMOJI.seta} Após a criação, você **poderá** editar o produto novamente.`,
      '',
      `${EMOJI.check} **Nome:** \`${draft.name}\``,
      `${draft.description ? EMOJI.check : '❌'} **Descrição:** \`${draft.description ? 'Definida' : 'Não definido'}\``,
      `${EMOJI.check} **Entrega Automática:** \`${draft.autoDelivery ? 'Sim' : 'Não'}\``,
      `${draft.icon ? EMOJI.check : '❌'} **Ícone:** \`${draft.icon ? 'Definido' : 'Não definido'}\` - Opcional`,
      `${draft.banner ? EMOJI.check : '❌'} **Banner:** \`${draft.banner ? 'Definido' : 'Não definido'}\` - Opcional`,
    ].join('\n'),
    guild,
    'Configuração do Produto • Clique nos botões abaixo',
  );
  if (draft.banner) e.setImage(draft.banner);
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('draft-desc'), draft.description ? 'Alterar Descrição' : 'Definir Descrição', ButtonStyle.Secondary, EMOJI.title),
        button(id('draft-auto'), `Entrega Automática: ${draft.autoDelivery ? 'Sim' : 'Não'}`, ButtonStyle.Secondary, draft.autoDelivery ? '🟢' : '🔴'),
      ),
      new ActionRowBuilder().addComponents(
        button(id('draft-banner'), draft.banner ? 'Alterar Banner' : 'Definir Banner', ButtonStyle.Secondary, EMOJI.visible),
        button(id('draft-icon'), draft.icon ? 'Alterar Ícone' : 'Definir Ícone', ButtonStyle.Secondary, EMOJI.heart),
      ),
      new ActionRowBuilder().addComponents(
        button(id('draft-create'), 'Criar Produto!!', ButtonStyle.Success, EMOJI.check),
        button(id('store'), 'Cancelar', ButtonStyle.Danger, EMOJI.cancel),
      ),
    ],
  };
}

function productSummary(product) {
  const fields = product.fields?.length
    ? product.fields.map((f) => `• Nome: \`${f.name}\`\n  Estoque: \`${stockCount(f)}\`\n  Valor: \`${money(f.price)}\``).join('\n')
    : 'Nenhum campo adicionado';
  const coupons = product.coupons?.length
    ? product.coupons
        .map((c) =>
          [
            `• Código: \`${c.code}\``,
            `  Quantidade: \`${c.quantity || 'Ilimitado'}\``,
            `  Desconto: \`${c.discount}%\``,
            `  Max. Usos: \`${c.maxUses || 'Ilimitado'}\``,
            `  Validade: \`${c.validity || 'Infinito'}\``,
            `  N. Usos: \`${c.uses || 0}\``,
            `  Condições: ${c.conditions?.length ? c.conditions.join(',') : 'Não Definido'}`,
          ].join('\n'),
        )
        .join('\n')
    : 'Nenhum cupom';
  return [
    '**Campos**',
    fields,
    '',
    '**Cupons**',
    coupons,
    '',
    '**Entrega automática**',
    product.autoDelivery ? 'Sim' : 'Não',
  ].join('\n');
}

function productPanel(guild, product) {
  const e = embed(product.name, productSummary(product), guild, 'Detalhes');
  if (product.banner) e.setImage(product.banner);
  if (product.icon) e.setThumbnail(product.icon);
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('product-edit', product.id), 'Editar', ButtonStyle.Secondary, EMOJI.title),
        button(id('fields', product.id), 'Gerenciar campos', ButtonStyle.Secondary, EMOJI.fields),
        button(id('coupons', product.id), 'Gerenciar cupons', ButtonStyle.Secondary, EMOJI.coupon),
      ),
      new ActionRowBuilder().addComponents(
        button(id('sell', product.id), 'Colocar a venda', ButtonStyle.Success, EMOJI.check),
        button(id('product-delete', product.id), 'Excluir Produto', ButtonStyle.Danger, EMOJI.trash),
      ),
      new ActionRowBuilder().addComponents(
        button(id('product-sync', product.id), 'Sincronizar Produto', ButtonStyle.Secondary, EMOJI.refresh),
        button(id('store'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function stockCount(field) {
  if (field.infinite?.enabled) return '∞';
  return (field.stock?.length || 0) + (field.ghostStock?.quantity || 0);
}

function fieldsPanel(guild, product) {
  const e = embed(`${product.name}\n:genesisPrancheta: Gerenciar Campos`, productSummary(product), guild, 'Gerenciar Campos');
  if (product.banner) e.setImage(product.banner);
  const components = [];
  if (product.fields.length) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(id('field-select', product.id))
      .setPlaceholder('Clique aqui para gerenciar algum campo')
      .addOptions(product.fields.slice(0, 25).map((f) => ({ label: f.name, description: f.description || 'Sem descrição', value: f.id })));
    components.push(new ActionRowBuilder().addComponents(select));
  }
  components.push(
    new ActionRowBuilder().addComponents(
      button(id('field-new', product.id), 'Adicionar campo', ButtonStyle.Secondary, EMOJI.plus),
      button(id('field-remove', product.id), 'Remover campo', ButtonStyle.Danger, EMOJI.trash, !product.fields.length),
      button(id('field-help'), 'ℹ️', ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(button(id('product', product.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
  );
  return { embeds: [e], components };
}

function fieldPanel(guild, product, field) {
  const conditions = [];
  if (field.requiredRole) conditions.push(`Cargo obrigatório: <@&${field.requiredRole}>`);
  if (field.minQty) conditions.push(`Comprar no mínimo ${field.minQty} unidades.`);
  if (field.maxQty) conditions.push(`Comprar no máximo ${field.maxQty} unidades.`);
  const e = embed(
    `${product.name}\n${field.emoji ? `${field.emoji} ` : ''}${field.name}`,
    [
      field.description || 'Sem descrição',
      '',
      `**Estoque**\n\`${stockCount(field)}\``,
      `**Preço**\n\`${money(field.price)}\``,
      `**Condições**\n${conditions.length ? conditions.join(' ') : 'Não Definido'}`,
      `**Cargos**\n${field.addRole || field.removeRole ? 'Configurado' : 'Não Definido'}`,
      `**Detalhes**\n${field.lastRestock ? 'Última reposição no estoque há pouco' : 'Criado há pouco'}`,
      `**Instruções**\n${field.instructions?.enabled ? 'Definidas 🟢' : 'Não Definido'}`,
    ].join('\n'),
    guild,
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('field-edit', product.id, field.id), 'Editar produto', ButtonStyle.Secondary, EMOJI.title),
        button(id('field-emoji', product.id, field.id), 'Definir emoji', ButtonStyle.Secondary, EMOJI.heart),
        button(id('field-roles', product.id, field.id), 'Cargos', ButtonStyle.Secondary, EMOJI.role),
        button(id('field-conditions', product.id, field.id), 'Definir condições', ButtonStyle.Secondary, EMOJI.pin),
      ),
      new ActionRowBuilder().addComponents(
        button(id('stock', product.id, field.id), 'Gerenciar estoque', ButtonStyle.Secondary, EMOJI.stock),
        button(id('stock-view', product.id, field.id), 'Ver estoque', ButtonStyle.Secondary, EMOJI.search),
        button(id('instructions', product.id, field.id), 'Instruções', ButtonStyle.Secondary, EMOJI.route),
      ),
      new ActionRowBuilder().addComponents(
        button(id('stock-clear', product.id, field.id), 'Limpar estoque', ButtonStyle.Danger, EMOJI.trash),
        button(id('fields', product.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function fieldEmojiPanel(guild, gs, product, field) {
  const options = syncedEmojiOptions(gs);
  if (!options.length) return null;
  const current = field.emoji ? `Atual: ${field.emoji}` : 'Atual: Nao definido';
  return {
    embeds: [embed('Definir emoji do campo', `**Campo:** \`${field.name}\`\n${current}`, guild, 'Gerenciar Campos')],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(id('field-emoji-select', product.id, field.id))
          .setPlaceholder('Selecione um emoji clonado')
          .addOptions(options),
      ),
      new ActionRowBuilder().addComponents(
        button(id('field-emoji-clear', product.id, field.id), 'Remover emoji', ButtonStyle.Danger, EMOJI.trash, !field.emoji),
        button(id('field', product.id, field.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function stockPanel(guild, product, field) {
  let body;
  if (field.infinite?.enabled) {
    body = [
      `**Campo:** \`${field.name}\``,
      '✅ **Modo:** Estoque Infinito `∞`',
      `📝 **Texto de entrega:** \`${field.infinite.text}\``,
      `:infogenesiss: Estoque pausado: 📦 ${field.stock.length} real + 👻 ${field.ghostStock?.quantity || 0} fantasma (${field.stock.length + (field.ghostStock?.quantity || 0)} total) — será restaurado ao desativar o modo infinito.`,
    ].join('\n');
  } else {
    body = [
      `**Campo:** \`${field.name}\``,
      field.ghostStock?.quantity ? `👻 **Estoque fantasma:**\n\`${field.ghostStock.quantity}x\` ${field.ghostStock.value}` : '',
      field.stock.length ? `📦 **Estoque real:**\n\`${field.stock.length}\` itens` : ':infogenesiss: Nenhum estoque adicionado. Use os botões abaixo para adicionar.',
    ].filter(Boolean).join('\n');
  }
  const e = embed('📦 Gerenciando estoque', body, guild);
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('stock-add', product.id, field.id), 'Adicionar', ButtonStyle.Secondary, EMOJI.plus, field.infinite?.enabled),
        button(id('stock-file', product.id, field.id), 'Enviar arquivo', ButtonStyle.Secondary, '📄', field.infinite?.enabled),
        button(id('stock-ghost', product.id, field.id), 'Estoque fantasma', ButtonStyle.Secondary, '👻', field.infinite?.enabled),
      ),
      new ActionRowBuilder().addComponents(
        button(id('stock-infinite', product.id, field.id), field.infinite?.enabled ? 'Desativar estoque infinito' : 'Ativar estoque infinito', ButtonStyle.Secondary, EMOJI.refresh),
        button(id('stock-remove', product.id, field.id), 'Remover item', ButtonStyle.Danger, EMOJI.trash, !field.stock.length),
      ),
      new ActionRowBuilder().addComponents(button(id('field', product.id, field.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function couponsPanel(guild, product) {
  const e = embed(product.name, productSummary(product), guild, 'Detalhes');
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('coupon-new', product.id), 'Adicionar cupom', ButtonStyle.Secondary, EMOJI.plus),
        button(id('coupon-remove', product.id), 'Remover cupom', ButtonStyle.Danger, EMOJI.trash, !product.coupons.length),
      ),
      new ActionRowBuilder().addComponents(button(id('product', product.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function ticketPanel(guild, gs) {
  const e = embed(
    `zenSallers\n${EMOJI.genesisTicket} Sistema de Tickets`,
    [
      'Configure e gerencie o sistema de tickets do seu servidor.',
      `${EMOJI.seta} **Status:** ${gs.ticket.configured ? `${EMOJI.yes} \`Configurado\`` : `${EMOJI.no} \`Não configurado\``}`,
      `${EMOJI.seta} **Funções:** \`${gs.ticket.functions.length}x configuradas\``,
      `${EMOJI.seta} **Modo de Abertura:** \`💬 ${gs.ticket.openMode}\``,
      `${EMOJI.seta} **Modo de Mensagem:** \`📋 ${gs.ticket.messageMode}\``,
      `${EMOJI.seta} **Horários:** \`${gs.ticket.hoursEnabled ? `🟢 ${gs.ticket.hoursByDay.filter((day) => day.active).length}/7 dias` : '🟢 24 horas'}\``,
      '📋 Suporte',
      `${EMOJI.verified} Selecione uma opção no menu abaixo para configurar.`,
    ].join('\n'),
    guild,
    'Tickets',
  ).setColor(parseHex(gs.ticket.color || '#FFFFFF'));
  if (gs.ticket.banner) e.setImage(gs.ticket.banner);
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('ticket-menu'))
    .setPlaceholder('Selecione uma opção para configurar')
    .addOptions(
      { label: 'Configurar Aparência', description: 'Título, descrição, cor e banner da mensagem', value: 'appearance', emoji: '⚙️' },
      { label: 'Adicionar Função', description: 'Criar uma nova função de atendimento', value: 'add-function', emoji: '➕' },
      { label: 'Gerenciar Funções', description: `Editar ou remover funções existentes (${gs.ticket.functions.length}x)`, value: 'functions', emoji: '📋' },
      { label: 'Modo de Abertura', description: `Atual: ${gs.ticket.openMode}`, value: 'open-mode', emoji: '📁' },
      { label: 'Configurar Horários', description: `Horários de atendimento (${gs.ticket.hoursByDay.filter((day) => day.active).length}/7 dias)`, value: 'hours', emoji: '⏰' },
      { label: 'Estatísticas', description: 'Estatísticas de tickets, staffs e desempenho', value: 'stats', emoji: '👥' },
      { label: `Modo atual: ${gs.ticket.messageMode}`, description: 'Alternar entre Embed clássico e Container V2', value: 'message-mode', emoji: '🛡️' },
    );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        button(id('ticket-sync'), 'Sincronizar Mensagens', ButtonStyle.Secondary, '<:syncMessages:1328930221029593098>'),
        button(id('ticket-post'), 'Postar Mensagem', ButtonStyle.Success, EMOJI.check),
      ),
      new ActionRowBuilder().addComponents(
        button(id('ticket-preview'), 'Preview', ButtonStyle.Secondary, '👁️'),
        button(id('ticket-help'), 'Ajuda', ButtonStyle.Primary, EMOJI.warning),
      ),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function welcomePanel(guild, gs) {
  const channelText = gs.channels.welcome ? `<#${gs.channels.welcome}>` : 'Não definido';
  const e = embed(
    'zenSallers\n:genesisPrancheta: Configurar Boas-Vindas',
    [
      'Configure a mensagem de boas-vindas que será enviada quando um novo membro entrar no servidor.',
      `**Status:** \`${gs.welcome.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
      `**Modo:** \`${gs.welcome.embed ? '📋 Embed' : '💬 Mensagem'}\``,
      `**Auto-deletar:** \`${gs.welcome.autoDeleteSeconds}s\``,
      `**Canal de boas-vindas:** \`${channelText}\``,
      'O canal de boas-vindas pode ser configurado nas configurações em canais.',
      '',
      '**Mensagem atual:**',
      `\`${gs.welcome.message}\``,
      '',
      '**Placeholders disponíveis:**',
      '`{member}` — Menciona o membro',
      '`{username}` — Nome de usuário',
      '`{displayname}` — Nome de exibição',
      '`{server}` — Nome do servidor',
      '`{membercount}` — Total de membros',
      '`{createdat}` — Criação da conta (relativo)',
      '`{accountage}` — Dias de conta',
    ].join('\n'),
    guild,
  );
  if (gs.welcome.image) e.setImage(gs.welcome.image);
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('welcome-message'), 'Editar Mensagem', ButtonStyle.Primary, EMOJI.edit),
        button(id('welcome-autodelete'), 'Auto-deletar', ButtonStyle.Primary, EMOJI.clock),
        button(id('welcome-toggle-embed'), gs.welcome.embed ? 'Usar Mensagem' : 'Usar Embed', ButtonStyle.Success, EMOJI.visible),
      ),
      new ActionRowBuilder().addComponents(
        button(id('welcome-image'), 'Imagem', ButtonStyle.Primary, EMOJI.title),
        button(id('welcome-color'), 'Alterar Cor', ButtonStyle.Secondary, EMOJI.settings, !gs.welcome.embed),
        button(id('welcome-title'), 'Título da Embed', ButtonStyle.Secondary, EMOJI.users, !gs.welcome.embed),
      ),
      new ActionRowBuilder().addComponents(
        button(id('welcome-preview'), '👁️ Preview', ButtonStyle.Secondary),
        button(id('welcome-toggle'), gs.welcome.enabled ? 'Desabilitar' : 'Habilitar', gs.welcome.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.syncGreen),
      ),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar ao início', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function automationsPanel(guild) {
  const e = embed(
    'zenSallers\nAutomação',
    'Aqui você pode configurar algumas ações automáticas para manter a segurança e a ordem no seu servidor.\n\nTutoriais de automações: [Ver vídeo](https://www.youtube.com/watch?v=iapo86RhF_o)',
    guild,
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-repost'), 'Repostagem', ButtonStyle.Primary, EMOJI.lightning),
        button(id('auto-messages'), 'Mensagens auto', ButtonStyle.Primary, EMOJI.syncMessages || EMOJI.forum),
        button(id('auto-clean'), 'Limpeza', ButtonStyle.Primary, EMOJI.sparks),
        button(id('auto-feedback'), 'Monitorar feedbacks', ButtonStyle.Primary, EMOJI.heart),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-lock'), 'Lock-Unlock', ButtonStyle.Primary, EMOJI.textChannel),
        button(id('auto-email'), 'Email Notify', ButtonStyle.Primary, EMOJI.role, true),
        button(id('auto-invite'), 'Invite Tracker', ButtonStyle.Success, EMOJI.users),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-restock'), 'Alerta de Restock', ButtonStyle.Success, EMOJI.notifyMember),
        button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function repostPanel(guild, gs) {
  const e = embed(
    'zenSallers\nRepostagem Automática',
    [
      'Seu Zend vai repostar seus produtos periodicamente, apagando a mensagem antiga e enviando-a novamente, para evitar denúncias nas mensagens.',
      '',
      '**Observação:** O sistema ajustará automaticamente o intervalo e a frequência dos reposts, considerando o fluxo de interações e a quantidade de produtos postados.',
      `**Próxima execução**\n\`21/06/2026 ${gs.automations.repost.time}:00\``,
      `**Produtos existentes**\n\`${gs.products.length}\``,
      `**Status do Nuke**\n\`${gs.automations.repost.nuke ? 'Ativado 🟢' : 'Desativado 🔴'}\``,
      '**Tempo até a próxima execução**\nem 14 horas',
      `**Status da função**\n\`${gs.automations.repost.enabled ? 'Ativado 🟢' : 'Desativado 🔴'}\``,
    ].join('\n'),
    guild,
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('repost-time'), 'Definir horário', ButtonStyle.Primary, EMOJI.clock),
        button(id('repost-nuke'), gs.automations.repost.nuke ? 'Desabilitar Nuke' : 'Habilitar Nuke', gs.automations.repost.nuke ? ButtonStyle.Danger : ButtonStyle.Success),
        button(id('repost-toggle'), gs.automations.repost.enabled ? 'Desabilitar função' : 'Habilitar função', gs.automations.repost.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
      ),
      new ActionRowBuilder().addComponents(
        button(id('repost-now'), 'Repostar todos os produtos', ButtonStyle.Secondary, '🛰️'),
        button(id('automations'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

const AUTOMATION_META = {
  messages: {
    title: 'Mensagens automáticas',
    description: 'Envie mensagens em canais definidos usando intervalo e conteúdo configurável.',
    fields: ['Status', 'Canal', 'Intervalo', 'Mensagem'],
  },
  cleanup: {
    title: 'Limpeza automática',
    description: 'Limpe mensagens antigas ou em excesso em canais definidos.',
    fields: ['Status', 'Canal', 'Intervalo', 'Quantidade'],
  },
  feedback: {
    title: 'Monitorar feedbacks',
    description: 'Acompanhe mensagens de feedback e registre avaliações públicas.',
    fields: ['Status', 'Canal monitorado'],
  },
  lock: {
    title: 'Lock-Unlock',
    description: 'Bloqueie e desbloqueie canais automaticamente em horários definidos.',
    fields: ['Status', 'Canal', 'Horário de lock', 'Horário de unlock'],
  },
  invite: {
    title: 'Invite Tracker',
    description: 'Monitore convites, rankings e entradas por link.',
    fields: ['Status', 'Convites rastreados'],
  },
  restock: {
    title: 'Alerta de Restock',
    description: 'Avise clientes quando produtos selecionados receberem estoque.',
    fields: ['Status', 'Canal', 'Cargo notificado'],
  },
};

function automationFeaturePanel(guild, gs, feature) {
  const meta = AUTOMATION_META[feature];
  const config = gs.automations[feature];
  const lines = [
    meta.description,
    '',
    `**Status:** \`${config.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
  ];
  if ('channel' in config) lines.push(`**Canal:** ${config.channel ? `<#${config.channel}>` : '`Não definido`'}`);
  if ('interval' in config) lines.push(`**Intervalo:** \`${config.interval} minutos\``);
  if ('everyMinutes' in config) lines.push(`**Intervalo:** \`${config.everyMinutes} minutos\``);
  if ('amount' in config) lines.push(`**Quantidade:** \`${config.amount} mensagens\``);
  if ('content' in config) lines.push(`**Mensagem:** \`${config.content}\``);
  if ('lockAt' in config) lines.push(`**Lock:** \`${config.lockAt}\``);
  if ('unlockAt' in config) lines.push(`**Unlock:** \`${config.unlockAt}\``);
  if ('role' in config) lines.push(`**Cargo:** ${config.role ? `<@&${config.role}>` : '`Não definido`'}`);

  return {
    embeds: [embed(`zenSallers\n${meta.title}`, lines.join('\n'), guild, 'Automações')],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('automation-toggle', feature), config.enabled ? 'Desabilitar' : 'Habilitar', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('automation-config', feature), 'Configurar', ButtonStyle.Secondary, EMOJI.settings),
        button(id('automation-channel', feature), 'Definir canal', ButtonStyle.Secondary, '💬', !('channel' in config)),
      ),
      new ActionRowBuilder().addComponents(
        button(id('automation-preview', feature), 'Preview', ButtonStyle.Secondary, EMOJI.visible),
        button(id('automations'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function customPanel(guild) {
  const e = embed(
    'zenSallers\nPersonalizações Gerais',
    ':setaAnimada: Personalize diversos elementos visuais do bot.\n:infogenesiss: **Selecione uma opção abaixo para configurar.**',
    guild,
    'Personalizações Gerais',
  );
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('custom-menu'))
    .setPlaceholder('⚙️ Selecione o que deseja personalizar')
    .addOptions(
      { label: 'Editar Cores das Embeds', description: 'Altere as cores utilizadas nas embeds do bot', value: 'colors', emoji: '🖌️' },
      { label: 'Personalizar Bot', description: 'Nickname, avatar, banner e status do bot', value: 'bot', emoji: '🤖' },
      { label: 'Marca', description: 'Customize o QR Code da sua marca', value: 'brand', emoji: '⭐' },
      { label: 'Log Pública de Entregas', description: 'Components V2, imagem, visualização', value: 'public-log', emoji: '🔔' },
      { label: 'Mensagem de Feedback (DM)', description: 'Customize a mensagem de feedback enviada na DM', value: 'feedback-dm', emoji: '💬' },
      { label: 'Mensagens de Produtos (V2)', description: 'Alternar entre Container V2 e Embed clássico para produtos', value: 'product-v2', emoji: '📋' },
    );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function customDetailPanel(guild, gs, value) {
  const data = gs.customization;
  if (value === 'colors') {
    const colorSelect = new StringSelectMenuBuilder()
      .setCustomId(id('custom-color-select'))
      .setPlaceholder('🖌️ Selecionar cor para editar')
      .addOptions(
        { label: 'Principal', description: `Atual: ${data.colors.default}`, value: 'default', emoji: '🔵' },
        { label: 'Processamento', description: `Atual: ${data.colors.processing}`, value: 'processing', emoji: '🟡' },
        { label: 'Sucesso', description: `Atual: ${data.colors.success}`, value: 'success', emoji: '🟢' },
        { label: 'Falha', description: `Atual: ${data.colors.error}`, value: 'error', emoji: '🔴' },
        { label: 'Finalizado', description: `Atual: ${data.colors.finished}`, value: 'finished', emoji: '🟣' },
      );
    const themeSelect = new StringSelectMenuBuilder()
      .setCustomId(id('custom-theme-select'))
      .setPlaceholder('🎨 Aplicar tema predefinido na cor Principal')
      .addOptions(
        { label: 'Padrão Zend', description: 'Principal: #008080', value: 'zend' },
        { label: 'Azul', description: 'Principal: #1A75FF', value: 'blue' },
        { label: 'Vermelho', description: 'Principal: #E60000', value: 'red' },
        { label: 'Verde', description: 'Principal: #009933', value: 'green' },
        { label: 'Amarelo', description: 'Principal: #CC9900', value: 'yellow' },
      );
    return {
      embeds: [
        embed(
          'zenSallers\n🎨 Cores das Embeds',
          [
            'Configure as cores das embeds do bot. Cada cor representa um **estado diferente** do sistema.',
            '',
            `🔵 **Principal**\n\`${data.colors.default}\` — Embeds gerais e padrão do bot`,
            `🟡 **Processamento**\n\`${data.colors.processing}\` — Pagamentos pendentes ou em processamento`,
            `🟢 **Sucesso**\n\`${data.colors.success}\` — Compras aprovadas e confirmações`,
            `🔴 **Falha**\n\`${data.colors.error}\` — Erros e pagamentos negados`,
            `🟣 **Finalizado**\n\`${data.colors.finished}\` — Tickets e pedidos encerrados`,
          ].join('\n'),
          guild,
          'Cores das Embeds',
        ),
      ],
      components: [
        new ActionRowBuilder().addComponents(colorSelect),
        new ActionRowBuilder().addComponents(themeSelect),
        new ActionRowBuilder().addComponents(button(id('custom-colors-reset'), 'Restaurar padrão Zend', ButtonStyle.Danger, EMOJI.refresh)),
        new ActionRowBuilder().addComponents(button(id('custom'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
      ],
    };
  }
  if (value === 'bot') {
    const botSelect = new StringSelectMenuBuilder()
      .setCustomId(id('custom-bot-select'))
      .setPlaceholder('⚙️ Selecione o que deseja personalizar')
      .addOptions(
        { label: 'Alterar Nickname', description: 'Mude o nome do bot', value: 'nickname', emoji: '🤖' },
        { label: 'Alterar Avatar', description: 'Mude a foto de perfil do bot', value: 'avatar', emoji: '🤖' },
        { label: 'Alterar Banner', description: 'Mude o banner do perfil do bot', value: 'banner', emoji: '🤖' },
        { label: 'Alterar Status 1', description: 'Configure o primeiro status rotativo', value: 'status1', emoji: '🤖' },
        { label: 'Alterar Status 2', description: 'Configure o segundo status rotativo', value: 'status2', emoji: '🤖' },
      );
    return {
      embeds: [
        embed(
          'zenSallers\n🤖 Personalização do Bot',
          [
            'Personalize a aparência e o status do seu bot.',
            `${EMOJI.warning} Selecione uma opção no menu abaixo para editar.`,
            '',
            `**Nickname:** \`${data.bot.nickname || 'Não definido'}\``,
            `**Avatar:** \`${data.bot.avatar ? 'Definido' : 'Não definido'}\``,
            `**Banner:** \`${data.bot.banner ? 'Definido' : 'Não definido'}\``,
            `**Status 1:** \`${data.bot.status1 || data.bot.status || 'Online'}\``,
            `**Status 2:** \`${data.bot.status2 || 'Não definido'}\``,
          ].join('\n'),
          guild,
          'Personalize seu bot',
        ),
      ],
      components: [
        new ActionRowBuilder().addComponents(botSelect),
        new ActionRowBuilder().addComponents(button(id('custom'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
      ],
    };
  }
  if (value === 'brand') {
    return {
      embeds: [
        embed(
          'zenSallers\nMarca',
          [`**Logo do QR Code:** \`${data.brand.qrLogo ? 'Definida' : 'Não definida'}\``, `**Cor do QR Code:** \`${data.brand.qrColor}\``].join('\n'),
          guild,
          'Marca',
        ),
      ],
      components: [
        new ActionRowBuilder().addComponents(button(id('custom-brand-edit'), 'Editar QR Code', ButtonStyle.Secondary, EMOJI.roller)),
        new ActionRowBuilder().addComponents(button(id('custom'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
      ],
    };
  }
  if (value === 'public-log') {
    const publicSelect = new StringSelectMenuBuilder()
      .setCustomId(id('custom-public-select'))
      .setPlaceholder('⚙️ Selecione o que deseja configurar')
      .addOptions(
        { label: 'Definir Imagem', description: 'Adicionar uma imagem/banner ao log de entrega', value: 'image', emoji: '🖼️' },
        { label: 'Remover Imagem', description: data.publicLog.image ? 'Remover a imagem configurada' : 'Nenhuma imagem configurada', value: 'remove-image', emoji: '❌' },
        { label: `Usar Container V2: ${data.publicLog.v2 ? 'Ativo' : 'Inativo'}`, description: 'Alternar entre Container V2 e Embed clássico', value: 'v2', emoji: '🟢' },
        { label: `Botão Comprar: ${data.publicLog.showBuy ? 'Visível' : 'Oculto'}`, description: 'Exibir/ocultar botão de comprar novamente', value: 'buy', emoji: '🛒' },
        { label: `Botão Feedbacks: ${data.publicLog.showFeedback ? 'Visível' : 'Oculto'}`, description: 'Exibir/ocultar botão de feedbacks', value: 'feedback', emoji: '🟢' },
      );
    return {
      embeds: [
        embed(
          'zenSallers\nLog Pública de Entregas',
          [
            'Configure a aparência do log público de entregas.',
            '',
            `» **Modo de Exibição:** \`${data.publicLog.v2 ? '📦 Container V2' : '📋 Embed Clássico'}\``,
            `» **Imagem/Banner:** \`${data.publicLog.image ? '✅ Definida' : '❌ Não definida'}\``,
            `» **Botão "Comprar":** \`${data.publicLog.showBuy ? '✅ Visível' : '❌ Oculto'}\``,
            `» **Botão "Feedbacks":** \`${data.publicLog.showFeedback ? '✅ Visível' : '❌ Oculto'}\``,
            '',
            `${EMOJI.verified} Selecione uma opção no menu abaixo para configurar.`,
          ].join('\n'),
          guild,
          'Log Pública',
        ),
      ],
      components: [
        new ActionRowBuilder().addComponents(publicSelect),
        new ActionRowBuilder().addComponents(
          button(id('custom-public-preview'), 'Preview', ButtonStyle.Secondary, EMOJI.visible),
          button(id('custom'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
        ),
      ],
    };
  }
  if (value === 'feedback-dm') {
    return {
      embeds: [embed(
        'zenSallers\n💬 Mensagem de Feedback (DM)',
        [
          'Configure a mensagem enviada na DM do comprador pedindo feedback.',
          `**Mensagem:** \`${data.feedbackDm.message ? 'Personalizada' : 'Padrão'}\``,
          `**Botão:** \`${data.feedbackDm.buttonText}\``,
          '',
          '💡 **Placeholders disponíveis:**',
          '`{saudacao}` → Saudação automática (Bom dia/Boa tarde/Boa noite)',
          '`{usuario}` → Menção do comprador',
        ].join('\n'),
        guild,
        'Mensagem de Feedback',
      )],
      components: [
        new ActionRowBuilder().addComponents(
          button(id('custom-feedback-edit'), 'Editar mensagem', ButtonStyle.Secondary, EMOJI.title),
          button(id('custom-feedback-button'), 'Editar texto do botão', ButtonStyle.Secondary),
          button(id('custom-feedback-reset'), 'Restaurar padrão', ButtonStyle.Secondary, EMOJI.refresh),
        ),
        new ActionRowBuilder().addComponents(
          button(id('custom-feedback-preview'), 'Preview', ButtonStyle.Secondary, EMOJI.visible),
        ),
        new ActionRowBuilder().addComponents(button(id('custom'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
      ],
    };
  }
  return {
    embeds: [
      embed(
        'zenSallers\nMensagens de Produtos (V2)',
        [
          'Configure o estilo visual das mensagens de produtos nos canais de venda.',
          '',
          `» **Modo de Exibição:** \`${data.productMessages.v2 ? '📦 Container V2' : '📋 Embed Clássico'}\``,
          `» **Cor Lateral (V2):** \`${data.productMessages.sideColor || '❌ Sem cor'}\``,
          '',
          data.productMessages.v2
            ? '» **Container V2 ativo** — Novas mensagens usarão o layout moderno com imagem compacta acima do container.'
            : '» **Embed Clássico ativo** — Mensagens de produtos usam embeds tradicionais do Discord.',
        ].join('\n'),
        guild,
        'Produtos V2',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('custom-product-v2'), data.productMessages.v2 ? 'Desativar Container V2' : 'Ativar Container V2', data.productMessages.v2 ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('custom-product-repost'), 'Repostar todos os produtos', ButtonStyle.Secondary, EMOJI.fields),
      ),
      new ActionRowBuilder().addComponents(button(id('custom-product-color'), `Cor Lateral: ${data.productMessages.sideColor || 'Desativada'}`, ButtonStyle.Secondary)),
      new ActionRowBuilder().addComponents(button(id('custom'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function statementPanel(guild, gs, user) {
  const e = embed(
    'Extrato de Vendas',
    [
      `Olá, ${user?.username || 'senhor'}! Aqui está o resumo rápido:`,
      `> 📅 **Hoje:** \`${money(gs.stats.salesToday)}\` (\`${gs.stats.countToday} vendas\`)`,
      `> 💰 **Total acumulado:** \`${money(gs.stats.salesTotal)}\` (\`${gs.stats.countTotal} vendas\`)`,
      '',
      '💡 Os valores são **brutos** — antes das taxas e do split dos gateways; o líquido na carteira é menor.',
      'Selecione um período abaixo para ver detalhes completos.',
    ].join('\n'),
    guild,
    'Extrato',
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('statement-period', 'today'), '📅 Hoje', ButtonStyle.Secondary),
        button(id('statement-period', '7'), '📆 7 dias', ButtonStyle.Secondary),
        button(id('statement-period', '30'), '🗓️ 30 dias', ButtonStyle.Secondary),
        button(id('statement-period', 'all'), '💰 Total', ButtonStyle.Success),
      ),
      new ActionRowBuilder().addComponents(
        button(id('statement-chart'), '📊 Ver Gráfico', ButtonStyle.Primary),
        button(id('statement-history'), 'Histórico de Compras', ButtonStyle.Primary, EMOJI.cartLoaded),
      ),
      new ActionRowBuilder().addComponents(
        button(id('statement-reset'), 'Resetar Estatísticas', ButtonStyle.Danger, EMOJI.redTrash),
        button(id('home'), 'Voltar ao Painel', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function statementPeriodPanel(guild, gs, period) {
  const now = Date.now();
  const days = period === 'today' ? 1 : Number(period);
  const cutoff = period === 'all' ? 0 : now - days * 24 * 60 * 60 * 1000;
  const purchases = gs.purchases.filter((purchase) => purchase.status === 'DELIVERED' && Number(purchase.at || 0) >= cutoff);
  const revenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  const label = period === 'today' ? 'Vendas de Hoje' : period === 'all' ? 'Todas as Vendas' : `Vendas dos Últimos ${period} Dias`;
  return {
    embeds: [embed(
      label,
      [
        `📅 Resumo ${period === 'today' ? 'nas **últimas 24 horas**' : `do período **${period === 'all' ? 'total' : `${period} dias`}**`}:`,
        '',
        `> 💵 **Rendimento:** \`${money(revenue)}\``,
        `> 🛒 **Pedidos aprovados:** \`${purchases.length}\``,
        `> 📦 **Produtos entregues:** \`${purchases.reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0)}\``,
        '',
        '**Valor bruto**',
      ].join('\n'),
      guild,
      'Extrato',
    )],
    components: [
      statementPanel(guild, gs).components[0],
      new ActionRowBuilder().addComponents(button(id('statement'), 'Voltar ao Extrato', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function statementHistoryPanel(guild, gs) {
  const purchases = [...gs.purchases].filter((item) => item.status === 'DELIVERED').sort((a, b) => b.at - a.at);
  const total = purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const lines = purchases.slice(0, 10).map((item, index) => [
    `**${index + 1}. ${item.product} (x${item.quantity})**`,
    `> 💵 Valor: \`${money(item.amount)}\` • ${item.paymentMethod || 'Aprovado manualmente'}`,
    `> 👤 Comprador: <@${item.userId}> • <t:${Math.floor(item.at / 1000)}:R>`,
    `> 🏷️ ID: \`${item.id}\``,
  ].join('\n'));
  return {
    embeds: [embed(
      'Histórico de Compras',
      [
        `🛒 **Total de compras:** \`${purchases.length}\` | 💰 **Valor total:** \`${money(total)}\``,
        'Valores brutos — antes das taxas e do split dos gateways; o líquido na carteira é menor.',
        '',
        lines.join('\n\n') || '`Nenhuma compra registrada.`',
      ].join('\n'),
      guild,
      'Página 1 de 1',
    )],
    components: [new ActionRowBuilder().addComponents(button(id('statement'), 'Voltar ao Extrato', ButtonStyle.Secondary, EMOJI.left))],
  };
}

function statementChartPanel(guild, gs) {
  const totals = new Map();
  for (const purchase of gs.purchases.filter((item) => item.status === 'DELIVERED')) {
    const current = totals.get(purchase.product) || { amount: 0, quantity: 0 };
    current.amount += Number(purchase.amount || 0);
    current.quantity += Number(purchase.quantity || 0);
    totals.set(purchase.product, current);
  }
  const sorted = [...totals.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 10);
  if (!sorted.length) {
    return {
      embeds: [embed('📊 Gráfico de Vendas', '`Nenhuma venda registrada.`', guild, 'Top produtos')],
      components: [new ActionRowBuilder().addComponents(button(id('statement'), 'Voltar ao Extrato', ButtonStyle.Secondary, EMOJI.left))],
    };
  }
  const width = 1000;
  const rowHeight = 82;
  const height = 180 + sorted.length * rowHeight;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#102a43';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Vendas do Servidor', width / 2, 48);
  ctx.fillStyle = '#829ab1';
  ctx.font = '16px Arial';
  ctx.fillText(`Top produtos mais vendidos - ${guild.name}`, width / 2, 76);
  const max = Math.max(1, ...sorted.map(([, value]) => value.amount));
  const chartX = 260;
  const chartWidth = 560;
  sorted.forEach(([name, value], index) => {
    const y = 125 + index * rowHeight;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#334e68';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(name.slice(0, 27), chartX - 20, y + 28);
    ctx.fillStyle = '#e8eef3';
    ctx.fillRect(chartX, y, chartWidth, 42);
    const gradient = ctx.createLinearGradient(chartX, 0, chartX + chartWidth, 0);
    gradient.addColorStop(0, '#279ce8');
    gradient.addColorStop(1, '#48c5bb');
    ctx.fillStyle = gradient;
    ctx.fillRect(chartX, y, Math.max(8, chartWidth * (value.amount / max)), 42);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#102a43';
    ctx.font = 'bold 15px Arial';
    ctx.fillText(`Qtd. ${value.quantity} - Lucro ${money(value.amount)}`, chartX + chartWidth + 16, y + 27);
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = '#829ab1';
  ctx.font = '13px Arial';
  ctx.fillText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 24, height - 20);
  const file = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'grafico-vendas.png' });
  return {
    content: '📊 **Gráfico de Vendas:**',
    embeds: [],
    files: [file],
    components: [new ActionRowBuilder().addComponents(button(id('statement'), 'Voltar ao Extrato', ButtonStyle.Secondary, EMOJI.left))],
  };
}

function giveawayPanel(guild, gs) {
  const active = gs.giveaways.filter((item) => item.status === 'active');
  const completed = gs.giveaways.filter((item) => item.status === 'completed');
  const participants = new Set(gs.giveaways.flatMap((item) => item.participants?.map((participant) => participant.userId) || []));
  const e = embed(
    `zenSallers\n${EMOJI.giveaway} Giveaway`,
    [
      'Gerencie todos os sorteios do seu servidor de forma intuitiva.',
      `**Sorteios ativos**\n\`🟢 ${active.length}x Ativos\``,
      `**Sorteios realizados**\n\`⭐ ${completed.length}x Realizados\``,
      `**Participações totais**\n\`👤 ${participants.size}x Usuários\``,
    ].join('\n'),
    guild,
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('giveaway-new'), 'Realizar sorteio', ButtonStyle.Success, EMOJI.activity),
        button(id('giveaway-manage'), 'Gerenciar sorteios', ButtonStyle.Secondary, EMOJI.settings),
      ),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

const GIVEAWAY_DURATIONS = [
  ['1 minuto', 'Teste rápido', 60_000],
  ['5 minutos', 'Teste', 5 * 60_000],
  ['10 minutos', 'Muito rápido', 10 * 60_000],
  ['15 minutos', 'Rápido', 15 * 60_000],
  ['30 minutos', 'Meia hora', 30 * 60_000],
  ['1 hora', 'Uma hora', 60 * 60_000],
  ['6 horas', 'Seis horas', 6 * 60 * 60_000],
  ['12 horas', 'Meio dia', 12 * 60 * 60_000],
  ['1 dia', 'Um dia', 24 * 60 * 60_000],
  ['3 dias', 'Três dias', 3 * 24 * 60 * 60_000],
  ['7 dias', 'Uma semana', 7 * 24 * 60 * 60_000],
  ['15 dias', 'Quinze dias', 15 * 24 * 60 * 60_000],
  ['30 dias', 'Um mês', 30 * 24 * 60 * 60_000],
];

function giveawayDraftPanel(guild, draft, step, title, description) {
  return embed(
    title,
    [
      `# ${draft.title}`,
      draft.description,
      '',
      `**Vencedores:** \`${draft.winners}x\``,
      draft.durationMs ? `**Duração:** \`${giveawayDurationLabel(draft.durationMs)}\`` : '',
      draft.channelId ? `**Canal:** <#${draft.channelId}>` : '',
      '',
      description,
    ].filter(Boolean).join('\n'),
    guild,
    `Etapa ${step}/5`,
  ).setColor(0xff0000);
}

function giveawayDurationLabel(durationMs) {
  return GIVEAWAY_DURATIONS.find(([, , value]) => value === durationMs)?.[0]
    || `${Math.round(durationMs / 60_000)} minutos`;
}

function giveawayDurationPanel(guild, draft) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('giveaway-duration'))
    .setPlaceholder('Clique aqui para escolher um...')
    .addOptions(GIVEAWAY_DURATIONS.map(([label, description, value]) => ({ label, description, value: String(value), emoji: '🕘' })));
  return {
    content: `<@${draft.creatorId}>`,
    embeds: [giveawayDraftPanel(guild, draft, 2, '🕘 Setar horário de finalização', 'Selecione uma duração rápida ou defina manualmente.')],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        button(id('giveaway-duration-manual'), 'Setar manualmente', ButtonStyle.Primary, '🕘'),
        button(id('giveaway-cancel-draft'), 'Cancelar', ButtonStyle.Danger, '❌'),
      ),
    ],
  };
}

function giveawayChannelPanel(guild, draft) {
  return {
    content: `<@${draft.creatorId}>`,
    embeds: [giveawayDraftPanel(guild, draft, 3, '# Escolher canal do sorteio', 'Selecione abaixo o canal onde o sorteio será publicado.')],
    components: [
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(id('giveaway-channel'))
          .setPlaceholder('Clique aqui para selecionar o canal...')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
      new ActionRowBuilder().addComponents(
        button(id('giveaway-back-duration'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
        button(id('giveaway-cancel-draft'), 'Cancelar', ButtonStyle.Danger, '❌'),
      ),
    ],
  };
}

function giveawayRolesPanel(guild, draft) {
  return {
    content: `<@${draft.creatorId}>`,
    embeds: [giveawayDraftPanel(
      guild,
      draft,
      4,
      '@ Gerenciar permissões de cargos (Opcional)',
      '✅ Cargos permitidos podem participar.\n❌ Cargos bloqueados não podem participar.\nAvance sem selecionar para permitir todos.',
    )],
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(id('giveaway-allowed-roles')).setPlaceholder('✅ Selecione cargos permitidos.').setMinValues(0).setMaxValues(10),
      ),
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(id('giveaway-blocked-roles')).setPlaceholder('❌ Selecione cargos não permitidos.').setMinValues(0).setMaxValues(10),
      ),
      new ActionRowBuilder().addComponents(
        button(id('giveaway-roles-next'), 'Avançar', ButtonStyle.Success, '✅'),
        button(id('giveaway-back-duration'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
        button(id('giveaway-cancel-draft'), 'Cancelar', ButtonStyle.Danger, '❌'),
      ),
    ],
  };
}

function giveawayExtrasPanel(guild, draft) {
  const configured = Object.entries(draft.extraEntries || {}).map(([roleId, entries]) => `<@&${roleId}> → +${entries}x`).join('\n');
  return {
    content: `<@${draft.creatorId}>`,
    embeds: [giveawayDraftPanel(
      guild,
      draft,
      5,
      '🎉 Configurar entradas extras (Opcional)',
      `**Configuração atual:**\n${configured || '⚠️ Nenhuma entrada extra configurada ainda.'}\n\nSelecione cargos para conceder uma entrada adicional ou finalize o sorteio.`,
    )],
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(id('giveaway-extra-roles')).setPlaceholder('🎯 Selecione cargos com entradas extras...').setMinValues(0).setMaxValues(10),
      ),
      new ActionRowBuilder().addComponents(
        button(id('giveaway-finish-setup'), 'Finalizar', ButtonStyle.Success, '✅'),
        button(id('giveaway-back-roles'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
        button(id('giveaway-cancel-draft'), 'Cancelar', ButtonStyle.Danger, '❌'),
      ),
    ],
  };
}

function giveawayMessagePayload(giveaway) {
  const participants = giveaway.participants?.length || 0;
  const ended = giveaway.status !== 'active';
  const e = new EmbedBuilder()
    .setColor(ended ? 0x888888 : 0xff0000)
    .setTitle(giveaway.title)
    .setDescription(giveaway.description)
    .addFields(
      { name: ended ? '🕘 Finalizado' : '🕘 Finaliza', value: ended ? `<t:${Math.floor((giveaway.endedAt || Date.now()) / 1000)}:R>` : `<t:${Math.floor(giveaway.endAt / 1000)}:R>`, inline: false },
      { name: '🏆 Vencedores', value: `\`${giveaway.winners}x\``, inline: true },
      { name: '👥 Participantes', value: `\`${participants}x\``, inline: true },
    )
    .setFooter({ text: `Sorteio · ID ${giveaway.id} · ${CREDIT_INVITE}` })
    .setTimestamp();
  if (Object.keys(giveaway.extraEntries || {}).length) {
    e.addFields({ name: '🎯 Entradas extras', value: Object.entries(giveaway.extraEntries).map(([roleId, entries]) => `<@&${roleId}>: +${entries}`).join('\n') });
  }
  return {
    embeds: [e],
    components: [new ActionRowBuilder().addComponents(
      button(id('giveaway-enter', giveaway.id), ended ? 'Sorteio Finalizado' : 'Participar', ButtonStyle.Success, '👥', ended),
      ...(ended ? [button(id('giveaway-reroll', giveaway.id), 'Reroll', ButtonStyle.Primary, '🔄')] : []),
    )],
  };
}

function giveawayManagePanel(guild, gs) {
  const active = gs.giveaways.filter((item) => item.status === 'active');
  if (!active.length) return simplePanel(guild, '🎉 Gerenciamento de giveaway\'s', 'Não há sorteios ativos no momento.', 'giveaway');
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('giveaway-manage-select'))
    .setPlaceholder('Selecione um sorteio para gerenciar')
    .addOptions(active.slice(0, 25).map((item) => ({
      label: item.title.slice(0, 100),
      description: `${item.participants.length} participantes • termina ${giveawayDurationLabel(Math.max(60_000, item.endAt - Date.now()))}`.slice(0, 100),
      value: item.id,
    })));
  return {
    embeds: [embed('🎉 Gerenciamento de giveaway\'s', `Selecione um dos \`${active.length}x\` sorteios ativos para gerenciar.`, guild)],
    components: [new ActionRowBuilder().addComponents(select), new ActionRowBuilder().addComponents(button(id('giveaway'), 'Voltar', ButtonStyle.Secondary, EMOJI.left))],
  };
}

function giveawayDetailPanel(guild, giveaway) {
  return {
    embeds: [embed(
      giveaway.title,
      [
        giveaway.description,
        '',
        `**Criador:** <@${giveaway.creatorId}>`,
        `**Canal:** <#${giveaway.channelId}>`,
        `**Participantes:** \`${giveaway.participants.length}x\``,
        `**Vencedores:** \`${giveaway.winners}x\``,
        `**Inicialização:** <t:${Math.floor(giveaway.createdAt / 1000)}:F>`,
        `**Finalização:** <t:${Math.floor(giveaway.endAt / 1000)}:F> (<t:${Math.floor(giveaway.endAt / 1000)}:R>)`,
        `**ID do Sorteio:** \`${giveaway.id}\``,
      ].join('\n'),
      guild,
      'Painel de Gerenciamento',
    ).setColor(0xff0000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('giveaway-force', giveaway.id), 'Forçar finalizamento', ButtonStyle.Success, '⚡'),
        button(id('giveaway-add-time', giveaway.id), 'Adicionar tempo', ButtonStyle.Success, '➕'),
        button(id('giveaway-discontinue', giveaway.id), 'Descontinuar', ButtonStyle.Danger, '🗑️'),
      ),
      new ActionRowBuilder().addComponents(
        button(id('giveaway-participants', giveaway.id), 'Ver participantes', ButtonStyle.Secondary, '👥'),
        button(id('giveaway-manage'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

async function finishGiveaway(guild, giveaway, reroll = false) {
  const pool = [];
  for (const participant of giveaway.participants || []) {
    for (let i = 0; i < Math.max(1, Number(participant.entries || 1)); i += 1) pool.push(participant.userId);
  }
  const winners = [];
  while (pool.length && winners.length < giveaway.winners) {
    const selected = pool[Math.floor(Math.random() * pool.length)];
    if (!winners.includes(selected)) winners.push(selected);
    for (let i = pool.length - 1; i >= 0; i -= 1) if (pool[i] === selected) pool.splice(i, 1);
  }
  giveaway.status = 'completed';
  giveaway.endedAt = Date.now();
  giveaway.winnerIds = winners;
  const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
  const message = channel?.isTextBased() ? await channel.messages.fetch(giveaway.messageId).catch(() => null) : null;
  if (message) await message.edit(giveawayMessagePayload(giveaway)).catch(() => null);
  if (channel?.isTextBased()) {
    await channel.send({
      content: winners.length
        ? `${reroll ? '🔄 **REROLL DO SORTEIO!**\n' : ''}🎉 ${winners.map((id) => `<@${id}>`).join(', ')}\nParabéns! Você ganhou o sorteio: **${giveaway.title}**\n\nHash de Autenticidade: \`${giveaway.id}\``
        : `Sorteio **${giveaway.title}** finalizado sem participantes válidos.`,
    }).catch(() => null);
  }
  return winners;
}

function scheduleGiveaway(guild, giveaway) {
  const remaining = giveaway.endAt - Date.now();
  if (remaining <= 0) return finishGiveaway(guild, giveaway).then(saveState).catch(() => null);
  const delay = Math.min(remaining, 2_147_000_000);
  const timer = setTimeout(() => {
    if (giveaway.status !== 'active') return;
    if (Date.now() < giveaway.endAt) scheduleGiveaway(guild, giveaway);
    else finishGiveaway(guild, giveaway).then(saveState).catch(() => null);
  }, delay);
  timer.unref?.();
  return timer;
}

function parseDuration(value) {
  const text = String(value || '').toLowerCase().replace(/\s+/g, '');
  let total = 0;
  for (const match of text.matchAll(/(\d+)(d|h|m)/g)) {
    const amount = Number(match[1]);
    total += amount * (match[2] === 'd' ? 86_400_000 : match[2] === 'h' ? 3_600_000 : 60_000);
  }
  return total;
}

function settingsPanel(guild) {
  const e = embed(`${EMOJI.seta} O que precisa configurar?`, '', guild);
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('roles-config'), 'Cargos', ButtonStyle.Secondary, EMOJI.role),
        button(id('channels-config'), 'Canais', ButtonStyle.Secondary, EMOJI.textChannel),
      ),
      new ActionRowBuilder().addComponents(
        button(id('antifake'), 'Anti-Fake', ButtonStyle.Secondary, EMOJI.users),
        button(id('payments'), 'Setar meu banco', ButtonStyle.Primary, EMOJI.wallet),
      ),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function rolesConfigPanel(guild, gs) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('role-kind'))
    .setPlaceholder('Clique aqui para redefinir algum cargo')
    .addOptions(
      { label: 'Definir cargo de Administrador', value: 'manager', emoji: '🛠️' },
      { label: 'Definir cargo de Suporte', value: 'staff', emoji: '♨️' },
      { label: 'Definir cargo de Cliente', value: 'client', emoji: '💎' },
      { label: 'Definir cargo de Membro', value: 'notify', emoji: '👥' },
    );
  return {
    embeds: [
      embed(
        'zenSallers\nConfigurar cargos',
        [
          `**Cargo de Administrador:** ${gs.roles?.manager ? `<@&${gs.roles.manager}>` : 'Não definido'}`,
          `**Cargo de Suporte:** ${gs.roles?.staff ? `<@&${gs.roles.staff}>` : 'Não definido'}`,
          `**Cargo de Cliente:** ${gs.roles?.client ? `<@&${gs.roles.client}>` : 'Não definido'}`,
          `**Cargo de Membro:** ${gs.roles?.notify ? `<@&${gs.roles.notify}>` : 'Não definido'}`,
        ].join('\n'),
        guild,
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        button(id('roles-manage'), 'Gerenciar cargos', ButtonStyle.Danger),
      ),
      new ActionRowBuilder().addComponents(button(id('settings'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function roleSelectionPanel(guild, gs, kind) {
  const label = { manager: 'Administrador', staff: 'Suporte', client: 'Cliente', notify: 'Membro' }[kind] || 'Cargo';
  return {
    embeds: rolesConfigPanel(guild, gs).embeds,
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(id('role-config-select', kind))
          .setPlaceholder(`Selecione um cargo para definir como ${label}`)
          .setMinValues(1)
          .setMaxValues(1),
      ),
      new ActionRowBuilder().addComponents(button(id('roles-config'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function channelsPanel(guild, gs) {
  const labels = [
    ['orderLogs', 'Pedidos (admin)'],
    ['publicPurchases', 'Compras (public)'],
    ['welcome', 'Boas-vindas'],
    ['system', 'Sistema'],
    ['entries', 'Entradas'],
    ['exits', 'Saídas'],
    ['messages', 'Mensagens'],
    ['voiceTraffic', 'Tráfego em call'],
    ['feedback', 'Feedback'],
    ['tickets', 'Tickets'],
    ['notify', 'Notify ON'],
    ['stockRequests', 'Solicitações de estoque'],
  ];
  const body = labels
    .map(([key, label]) => `**• ${label}:** ${gs.channels[key] ? `<#${gs.channels[key]}>` : 'Não definido'}`)
    .join('\n');
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('channel-kind'))
    .setPlaceholder('Clique aqui para redefinir algum canal')
    .addOptions(
      { label: 'Definir canal de logs de pedidos (admin)', value: 'orderLogs', emoji: '🛒' },
      { label: 'Definir canal de evento de compras (public)', value: 'publicPurchases', emoji: '💵' },
      { label: 'Definir canal de boas vindas', value: 'welcome', emoji: '👋' },
      { label: 'Definir canal de logs do sistema', value: 'system', emoji: '🛠️' },
      { label: 'Definir canal de logs de entradas', value: 'entries', emoji: '➡️' },
      { label: 'Definir canal de logs de saídas', value: 'exits', emoji: '⬅️' },
      { label: 'Definir canal de logs de mensagens', value: 'messages', emoji: '✏️' },
      { label: 'Definir canal de logs de tráfego de call', value: 'voiceTraffic', emoji: '👻' },
      { label: 'Definir canal de logs de feedback', value: 'feedback', emoji: '🎫' },
      { label: 'Definir canal de logs de Ticket', value: 'tickets', emoji: '🎟️' },
      { label: 'Definir canal de logs de ativação de notificação', value: 'notify', emoji: '❕' },
      { label: 'Definir canal de logs de solicitações de estoque', value: 'stockRequests', emoji: '🛒' },
    );
  return {
    embeds: [embed('zenSallers\nConfigurar Canais', body, guild)],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        button(id('channels-auto'), 'Criação e edição automática', ButtonStyle.Secondary, '🪄'),
        button(id('channels-reset'), 'Resetar tudo', ButtonStyle.Danger, EMOJI.left),
      ),
      new ActionRowBuilder().addComponents(button(id('settings'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function channelSelectionPanel(guild, gs, kind) {
  const panel = channelsPanel(guild, gs);
  const label = {
    orderLogs: 'log de pedidos (admin)',
    publicPurchases: 'evento de compras (public)',
    welcome: 'boas-vindas',
    system: 'logs do sistema',
    entries: 'logs de entradas',
    exits: 'logs de saídas',
    messages: 'logs de mensagens',
    voiceTraffic: 'tráfego em call',
    feedback: 'logs de feedback',
    tickets: 'logs de tickets',
    notify: 'logs de notificações',
    stockRequests: 'solicitações de estoque',
  }[kind] || 'esta configuração';

  return {
    embeds: panel.embeds,
    components: [
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(id('channel-set'))
          .setPlaceholder(`Selecione um canal para ${label}`)
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
      new ActionRowBuilder().addComponents(button(id('channels-config'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function zenWalletPanel(guild, gs) {
  const wallet = gs.payments.zenWallet;
  const users = Object.values(gs.balance.users);
  const totalBalance = users.reduce((sum, user) => sum + Number(user.balance || 0), 0);
  const status = wallet.enabled ? 'HABILITADO 🟢' : 'DESABILITADO 🔴';
  return {
    embeds: [
      embed(
        `Sistema zenWallet - ${status}`,
        [
          `${EMOJI.warning} Observação: Cadastre-se primeiro para habilitar os botões de saldo e saque.`,
          '',
          'zenWallet é uma carteira digital automatizada e integrada que permite:',
          'Receber pagamentos: Clientes pagam com PIX',
          'Acumular saldo: Vendedores acumulam saldo nas vendas',
          'Sacar valores: Saque para qualquer chave PIX',
          '',
          `**Status**\n${wallet.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}`,
          `**Usuários cadastrados**\n${users.length}x`,
          `**Saldo disponível**\n${money(totalBalance)}`,
          `**Gateway ativo**\n${EMOJI.yesgenesis} PagC`,
          '**Taxa de MED**\n0,00% · 0 MEDs',
        ].join('\n'),
        guild,
        'zenWallet',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('zenwallet-toggle'), wallet.enabled ? 'Desabilitar' : 'Habilitar', ButtonStyle.Secondary, EMOJI.syncBlue, !wallet.configured),
        button(id('zenwallet-register'), 'Cadastrar usuário', ButtonStyle.Secondary, EMOJI.account),
        button(id('zenwallet-balance'), 'Ver saldo', ButtonStyle.Secondary, EMOJI.wallet, true),
        button(id('zenwallet-info'), 'Saber mais', ButtonStyle.Secondary, EMOJI.warning, wallet.enabled),
      ),
      new ActionRowBuilder().addComponents(
        button(id('zenwallet-gateway'), 'Gateway: PagC', ButtonStyle.Secondary, EMOJI.syncGreen, wallet.enabled),
        button(id('zenwallet-withdraw-log'), 'Extrato de saques', ButtonStyle.Secondary, EMOJI.receipt, true),
        button(id('zenwallet-fee'), '💸Repasse de taxa', ButtonStyle.Secondary, undefined, true),
      ),
      new ActionRowBuilder().addComponents(
        button(id('zenwallet-auto-withdraw'), '⚡Saque Automático', ButtonStyle.Secondary, undefined, true),
        button(id('zenwallet-withdraw'), 'Realizar um saque', ButtonStyle.Secondary, EMOJI.wallet, true),
      ),
      new ActionRowBuilder().addComponents(button(id('payments'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function paymentsPanel(guild, gs) {
  const p = gs.payments;
  const line = (name, item) => `${name}\n\`${item.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\`\n\`${item.configured ? '🔵 Configurado' : '🔴 Não configurado'}\``;
  const e = embed(
    'zenSallers\nConfigurar formas de pagamento',
    [
      'Configure, habilite e desabilite as formas de pagamento disponíveis por aqui.',
      line('Efí Bank', p.efi),
      line('Mercado Pago', p.mercadoPago),
      line('zenWallet', p.zenWallet),
      line('Pagamento Manual', p.manual),
      line('Nubank', p.nubank),
      line('Push-in Pay', p.pushinpay),
      line('Litecoin Wallet', p.litecoin),
    ].join('\n\n'),
    guild,
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('pay-efi'), 'Efí Bank', ButtonStyle.Primary, EMOJI.efi),
        button(id('pay-mercado'), 'Mercado Pago', ButtonStyle.Primary, EMOJI.mercadoPago),
        button(id('pay-manual'), 'Pagamento Manual', ButtonStyle.Primary, EMOJI.pix),
      ),
      new ActionRowBuilder().addComponents(
        button(id('pay-push'), 'Push-in Pay', ButtonStyle.Primary, EMOJI.pushInPay, true),
        button(id('pay-litecoin'), 'Litecoin Wallet', ButtonStyle.Primary, EMOJI.litecoin, true),
      ),
      new ActionRowBuilder().addComponents(
        button(id('pay-zenwallet'), 'zenWallet - Banco virtual do zenSallers', ButtonStyle.Primary, EMOJI.bank),
        button(id('settings'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function manualPaymentPanel(guild, gs) {
  const p = gs.payments.manual;
  const e = embed(
    `zenSallers\nConfigurar Pagamento Manual - ${p.enabled ? 'Habilitado' : 'Desabilitado'}`,
    [
      'Aqui, você pode definir uma chave Pix e uma mensagem para o seu Zend enviar quando a forma de pagamento "Pix" for selecionada. Ele irá gerar um QR Code com o valor exato do carrinho para essa chave.',
      'Lembre-se de que ele não consegue verificar se o pagamento foi aprovado, então você precisará clicar em "Confirmar pagamento" para iniciar o processo de entrega.',
      '',
      `**Chave PIX**\n${p.pixKey || 'Não definido'}`,
      `**Tipo da chave**\n\`${p.keyType || 'Não definido'}\``,
      `**Mensagem de auxílio**\n• ${p.message}`,
      '',
      '**Aviso:** Manter esta função habilitada sobrescreverá a função automática.',
    ].join('\n'),
    guild,
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('pay-manual-toggle'), p.enabled ? 'Desabilitar' : 'Habilitar', p.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('pay-manual-edit'), 'Editar chave pix e mensagem', ButtonStyle.Secondary, EMOJI.title),
      ),
      new ActionRowBuilder().addComponents(button(id('payments'), 'Voltar', ButtonStyle.Secondary, '↩️')),
    ],
  };
}

function gatewayPaymentPanel(guild, gs, type) {
  const isEfi = type === 'efi';
  const item = gs.payments[type];
  const title = isEfi ? 'Efí Bank' : 'Mercado Pago';
  return {
    embeds: [embed(
      `zenSallers\nConfigurar ${title}`,
      [
        `Configure o gateway **${title}** para aprovar pagamentos PIX automaticamente.`,
        '',
        `**Status:** \`${item.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
        `**Credenciais:** \`${item.configured ? '🔵 Configuradas' : '🔴 Não configuradas'}\``,
        isEfi ? `**Chave PIX:** \`${item.pixKey || 'Não definida'}\`` : `**Access Token:** \`${item.accessToken ? 'Configurado' : 'Não definido'}\``,
        '',
        'As credenciais ficam salvas somente no arquivo local do bot.',
      ].join('\n'),
      guild,
      'Pagamentos',
    )],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('gateway-toggle', type), item.enabled ? 'Desabilitar' : 'Habilitar', item.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('gateway-config', type), 'Configurar credenciais', ButtonStyle.Primary, EMOJI.settings),
      ),
      new ActionRowBuilder().addComponents(button(id('payments'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function antiFakePanel(guild, gs) {
  const config = gs.antiFake;
  return {
    embeds: [embed(
      'zenSallers\n🕵️ Sistema Anti-Fake',
      [
        'Analise contas recém-criadas e registre entradas suspeitas no servidor.',
        '',
        `**Status:** \`${config.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
        `**Idade mínima da conta:** \`${config.minimumAccountDays} dias\``,
        `**Ação:** \`${config.action}\``,
        `**Canal de entradas:** ${gs.channels.entries ? `<#${gs.channels.entries}>` : '`Não configurado`'}`,
      ].join('\n'),
      guild,
      'Anti-Fake',
    )],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('antifake-toggle'), config.enabled ? 'Desabilitar' : 'Habilitar', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('antifake-config'), 'Configurar', ButtonStyle.Primary, EMOJI.settings),
      ),
      new ActionRowBuilder().addComponents(button(id('settings'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function cloudPanel(guild, gs) {
  const e = embed(
    'zenCloud • Infraestrutura em Nuvem',
    [
      '☁️ **zenCloud**',
      'Gerencie a sincronização inteligente do seu servidor com a nuvem. Membros verificados via OAuth2 ficam protegidos e podem ser recuperados a qualquer momento.',
      `${EMOJI.loading} Dados verificados há 3 segundos`,
      `${EMOJI.verified} Aplicação OAuth2\n\`${gs.cloud.linked ? '🟢 Vinculada' : '🔴 Não vinculada'}\``,
      `${EMOJI.memberCloud} Membros Sincronizados\n\`${gs.cloud.syncedMembers ?? `${EMOJI.no} Erro de conexão`}\``,
      `${EMOJI.backup} Backup Automático\n\`🔵 Em breve\``,
      `${EMOJI.seta} Última verificação\nsábado, 20 de junho de 2026 às 19:32`,
    ].join('\n'),
    guild,
    'zenCloud',
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('cloud-oauth'), 'Gerenciar OAuth2', ButtonStyle.Primary, EMOJI.cloud),
        button(id('cloud-backup'), 'Backup', ButtonStyle.Secondary, EMOJI.folder, true),
      ),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function oauthPanel(guild, gs) {
  const e = embed(
    'zenCloud • OAuth2',
    [
      `${EMOJI.memberCloud} **Sincronização de membros via OAuth2**`,
      '',
      gs.cloud.linked
        ? `${EMOJI.yes} Aplicação registrada.`
        : `${EMOJI.no} Aplicação **não registrada**. Siga os passos abaixo para ativar:`,
      '> **1.** Acesse o **Discord Developer Portal** e obtenha o **Token** e o **Client Secret** da sua aplicação',
      '> **2.** Adicione o **Redirect URL** abaixo na sua aplicação:',
      '`https://zendapplications.com.br/oauth2/callback`',
      '> **3.** Clique em **"Registrar aplicação"** para vincular ao zenCloud',
    ].join('\n'),
    guild,
    'OAuth2',
  );
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('oauth-register'), 'Registrar aplicação', ButtonStyle.Secondary, EMOJI.cloud, gs.cloud.linked),
        button(id('oauth-config'), 'Configurar', ButtonStyle.Secondary, EMOJI.settings, !gs.cloud.linked),
      ),
      new ActionRowBuilder().addComponents(
        button(id('oauth-recover'), 'Recuperar membros', ButtonStyle.Secondary, EMOJI.users, !gs.cloud.linked),
        button(id('oauth-link'), 'Link OAuth2', ButtonStyle.Secondary, EMOJI.url, !gs.cloud.linked),
        linkButton('https://discord.com/developers/applications', 'Tutorial'),
      ),
      new ActionRowBuilder().addComponents(
        button(id('oauth-reset'), 'Resetar OAuth2', ButtonStyle.Danger, EMOJI.trashcan, !gs.cloud.linked),
        button(id('cloud'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function oauthConfigPanel(guild, gs) {
  const complete = [gs.cloud.serverId, gs.cloud.verifiedRoleId, gs.cloud.webhookUrl].filter(Boolean).length;
  return {
    embeds: [embed(
      'OAuth2 • Configurações do zenCloud',
      [
        '» **Configure o OAuth2 do zenCloud**',
        '',
        'Preencha os campos abaixo para ativar a sincronização de membros. O bot de autenticação precisa estar no servidor de destino.',
        '',
        `**Status:** ${complete === 3 ? '🟢 Configuração completa' : '🔴 Não iniciado'} \`${complete}/3 campos\``,
        '',
        `**ID do Servidor**\n${gs.cloud.serverId ? `\`${gs.cloud.serverId}\`` : '\`Não configurado\`'}`,
        `**Cargo Verificado**\n${gs.cloud.verifiedRoleId ? `<@&${gs.cloud.verifiedRoleId}>` : '\`Não configurado\`'}`,
        `**Webhook**\n${gs.cloud.webhookUrl ? '✅ Configurado' : '\`Não configurado\`'}`,
      ].join('\n'),
      guild,
      'OAuth2 Config',
    )],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('oauth-server-id'), 'ID do Servidor', ButtonStyle.Primary, '📍'),
        button(id('oauth-role'), 'Cargo', ButtonStyle.Primary, '📛'),
        button(id('oauth-webhook'), 'Webhook', ButtonStyle.Primary, '♨️'),
      ),
      new ActionRowBuilder().addComponents(
        button(id('oauth-verify'), 'Verificar Status', ButtonStyle.Secondary, '🔍'),
        linkButton(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=268438528`, 'Adicionar Bot Auth', '🤖'),
      ),
      new ActionRowBuilder().addComponents(button(id('cloud-oauth'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function oauthRolePanel(guild, gs) {
  return {
    embeds: oauthConfigPanel(guild, gs).embeds,
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(id('oauth-role-select')).setPlaceholder('Selecione o cargo atribuído aos usuários autenticados').setMinValues(1).setMaxValues(1),
      ),
      new ActionRowBuilder().addComponents(button(id('oauth-config'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function protectPanel(guild) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('protect-menu'))
    .setPlaceholder('Clique aqui para selecionar uma opção')
    .addOptions(
      { label: 'Moderação', description: 'Proteções de moderação do servidor.', value: 'moderation', emoji: '🛡️' },
      { label: 'Sistema Anti-Raid', description: 'Gerencie o sistema de anti-raid do servidor.', value: 'antiraid', emoji: '🔨' },
    );
  return {
    embeds: [embed('zenProtect', 'Clique aqui para selecionar uma opção', guild)],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(button(id('home'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function protectDetailPanel(guild, gs, value) {
  if (value === 'moderation') {
    const select = new StringSelectMenuBuilder()
      .setCustomId(id('protect-moderation-menu'))
      .setPlaceholder('Selecione uma proteção')
      .addOptions(
        { label: 'Self-bot imagem + link', description: 'Detecta envio repetido de imagem/anexo com link.', value: 'selfbot', emoji: '🛡️' },
        { label: 'Anti-invite Discord', description: 'Bloqueia convites Discord com whitelist de cargos.', value: 'antiinvite', emoji: '👥' },
      );
    return {
      embeds: [
        embed(
          'zenSallers\n🛡️ Moderação',
          [
            'Configure as proteções de moderação disponíveis para o servidor.',
            '',
            'Atualmente estão disponíveis os módulos **Self-bot imagem + link** e **Anti-invite Discord**.',
            '',
            `**Self-bot imagem + link**\n\`${gs.protect.selfBot.enabled ? '✅ Ativado' : '❌ Desativado'}\``,
            `**Anti-invite Discord**\n\`${gs.protect.antiInvite.enabled ? '✅ Ativado' : '❌ Desativado'}\``,
            `**# Canal de Logs da Moderação**\n${gs.protect.selfBot.logChannel || gs.protect.antiInvite.logChannel ? `<#${gs.protect.selfBot.logChannel || gs.protect.antiInvite.logChannel}>` : '`Não configurado`'}`,
          ].join('\n'),
          guild,
        ),
      ],
      components: [
        new ActionRowBuilder().addComponents(select),
        new ActionRowBuilder().addComponents(
          button(id('protect'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
        ),
      ],
    };
  }
  return {
    embeds: [
      embed(
        'zenProtect • Sistema Anti-Raid',
        [
          `**Anti-Raid:** \`${gs.protect.antiraid ? '🟢 Ativo' : '🔴 Inativo'}\``,
          `**Limite de entradas:** \`${gs.protect.raidLimit}\``,
          `**Janela de tempo:** \`${gs.protect.raidWindowSeconds}s\``,
          `**Punição:** \`${gs.protect.raidPunishment}\``,
        ].join('\n'),
        guild,
        'zenProtect',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('protect-toggle', 'antiraid'), gs.protect.antiraid ? 'Desabilitar Anti-Raid' : 'Habilitar Anti-Raid', gs.protect.antiraid ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.shield),
        button(id('protect-raid-config'), 'Configurar limites', ButtonStyle.Secondary, EMOJI.settings),
      ),
      new ActionRowBuilder().addComponents(button(id('protect'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function protectSelfBotPanel(guild, gs) {
  const config = gs.protect.selfBot;
  return {
    embeds: [embed(
      'zenSallers\n🛡️ Self-bot imagem/anexo',
      [
        'Detecta envio repetido de **imagens/anexos em canais diferentes** num curto intervalo.',
        '',
        `> Padrão inicial: **${config.limit} imagens/anexos** em 2+ canais dentro de 12s.`,
        '> Também detecta com **3 imagens/anexos** quando os nomes começarem com `IMG_` ou `Untitled`.',
        '',
        `**Status da Proteção**\n\`${config.enabled ? '✅ Ativado' : '❌ Desativado'}\``,
        `**# Canal de Logs**\n${config.logChannel ? `<#${config.logChannel}>` : '`Não configurado`'}`,
        `**Limite atual**\n\`${config.limit} imagens/links\``,
      ].join('\n'),
      guild,
    )],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('protect-selfbot-toggle'), config.enabled ? 'Desativar' : 'Ativar', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('protect-selfbot-channel'), 'Definir canal', ButtonStyle.Primary, '🚩'),
        button(id('protect-selfbot-limit'), 'Ajustar limite', ButtonStyle.Secondary, '🕘'),
      ),
      new ActionRowBuilder().addComponents(button(id('protect-moderation'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function protectAntiInvitePanel(guild, gs) {
  const config = gs.protect.antiInvite;
  return {
    embeds: [embed(
      'zenSallers\n🛡️ Anti-invite Discord',
      [
        'Bloqueia convites Discord enviados no servidor.',
        '',
        'Os cargos de **admin e suporte** configurados entram automaticamente na whitelist.',
        '',
        `**Status da Proteção**\n\`${config.enabled ? '✅ Ativado' : '❌ Desativado'}\``,
        `**# Canal de Logs**\n${config.logChannel ? `<#${config.logChannel}>` : '`Não configurado`'}`,
        `**@ Cargos padrão liberados**\n${[gs.roles.manager, gs.roles.staff].filter(Boolean).map((roleId) => `<@&${roleId}>`).join(' • ') || '`Nenhum configurado`'}`,
        `**@ Cargos extras liberados**\n${config.whitelistRoles.length ? config.whitelistRoles.map((roleId) => `<@&${roleId}>`).join(' • ') : '`Nenhum configurado`'}`,
      ].join('\n'),
      guild,
    )],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('protect-antiinvite-toggle'), config.enabled ? 'Desativar' : 'Ativar', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('protect-antiinvite-channel'), 'Definir canal', ButtonStyle.Primary, '🚩'),
        button(id('protect-antiinvite-whitelist'), 'Whitelist', ButtonStyle.Secondary, '@'),
      ),
      new ActionRowBuilder().addComponents(button(id('protect-moderation'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function protectChannelSelectionPanel(guild, gs, type) {
  const base = type === 'selfbot' ? protectSelfBotPanel(guild, gs) : protectAntiInvitePanel(guild, gs);
  return {
    embeds: base.embeds,
    components: [
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(id('protect-channel-set', type))
          .setPlaceholder('Selecionar canal de logs')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
      new ActionRowBuilder().addComponents(button(id(type === 'selfbot' ? 'protect-selfbot' : 'protect-antiinvite'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function protectWhitelistPanel(guild, gs) {
  return {
    embeds: [embed(
      'zenSallers\n@ Whitelist de cargos',
      `Admin e suporte entram automaticamente. Selecione abaixo apenas os **cargos extras** que também devem ser liberados.\n\n**Cargos extras atuais**\n${gs.protect.antiInvite.whitelistRoles.length ? gs.protect.antiInvite.whitelistRoles.map((roleId) => `<@&${roleId}>`).join(' • ') : '`Nenhum configurado`'}`,
      guild,
    )],
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(id('protect-whitelist-select')).setPlaceholder('Selecionar cargos extras liberados').setMinValues(0).setMaxValues(10),
      ),
      new ActionRowBuilder().addComponents(button(id('protect-antiinvite'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function simplePanel(guild, title, description, back = 'home') {
  return {
    embeds: [embed(title, description, guild)],
    components: [new ActionRowBuilder().addComponents(button(id(back), 'Voltar', ButtonStyle.Secondary, EMOJI.left))],
  };
}

function rolesFieldPanel(guild, product, field) {
  return {
    embeds: [
      embed(
        `${product.name} • ${field.name}\nCargos do Campo (Opcionais)`,
        [
          `:infogenesiss: Configure os **cargos** que serão adicionados ou removidos após a compra do campo **${field.name}**.`,
          ':setaAnimada: Esses cargos são opcionais, O cargo de cliente é defaut e pode ser adicionado em **Configurações > Cargos**',
          '',
          `❌ **Cargo para Adicionar**\n> ${field.addRole ? `<@&${field.addRole}>` : 'Não definido'}`,
          `❌ **Cargo para Remover**\n> ${field.removeRole ? `<@&${field.removeRole}>` : 'Não definido'}`,
        ].join('\n'),
        guild,
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('field-role-add', product.id, field.id), 'Definir Cargo Add', ButtonStyle.Secondary, EMOJI.role),
        button(id('field-role-rem', product.id, field.id), 'Definir Cargo Rem', ButtonStyle.Secondary, EMOJI.role),
      ),
      new ActionRowBuilder().addComponents(button(id('field', product.id, field.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function fieldRolePickerPanel(guild, product, field, mode) {
  const isAdd = mode === 'add';
  return {
    embeds: [
      embed(
        `${product.name} • ${field.name}\nDefinir Cargo para ${isAdd ? 'Adicionar' : 'Remover'}`,
        [
          `:infogenesiss: Selecione o cargo que será ${isAdd ? 'adicionado ao comprador após' : 'removido do comprador após'} a compra.`,
          'Use o menu abaixo para selecionar ou clique em "Inserir ID" para digitar manualmente.',
        ].join('\n'),
        guild,
        'Selecione um cargo',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(id('field-role-select', product.id, field.id, mode))
          .setPlaceholder(`Selecione o cargo para ${isAdd ? 'adicionar' : 'remover'}`)
          .setMinValues(1)
          .setMaxValues(1),
      ),
      new ActionRowBuilder().addComponents(
        button(id('field-role-id', product.id, field.id, mode), 'Inserir ID', ButtonStyle.Secondary, EMOJI.title),
        button(id('field-roles', product.id, field.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function conditionsPanel(guild, product, field) {
  return {
    embeds: [
      embed(
        `${product.name} • ${field.name}\nCondições de Compra (Opcionais)`,
        [
          `:infogenesiss: Configure as **condições de compra** para o campo **${field.name}**.`,
          `❌ **Cargo Obrigatório**\n> ${field.requiredRole ? `<@&${field.requiredRole}>` : 'Não definido'}`,
          `${field.minQty ? '✅' : '❌'} **Quantidade Mínima**\n> ${field.minQty ? `${field.minQty} unidades` : 'Não definido'}`,
          `${field.maxQty ? '✅' : '❌'} **Quantidade Máxima**\n> ${field.maxQty ? `${field.maxQty} unidades` : 'Não definido'}`,
        ].join('\n'),
        guild,
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('cond-role', product.id, field.id), 'Definir Cargo', ButtonStyle.Secondary, EMOJI.role),
        button(id('cond-min', product.id, field.id), field.minQty ? 'Alterar Mínimo' : 'Definir Mínimo', ButtonStyle.Secondary, EMOJI.pin),
        button(id('cond-max', product.id, field.id), field.maxQty ? 'Alterar Máximo' : 'Definir Máximo', ButtonStyle.Secondary, EMOJI.pin),
      ),
      new ActionRowBuilder().addComponents(
        button(id('cond-min-remove', product.id, field.id), 'Remover Mínimo', ButtonStyle.Danger, EMOJI.trash, !field.minQty),
        button(id('cond-max-remove', product.id, field.id), 'Remover Máximo', ButtonStyle.Danger, EMOJI.trash, !field.maxQty),
      ),
      new ActionRowBuilder().addComponents(button(id('field', product.id, field.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function conditionRolePickerPanel(guild, product, field) {
  return {
    embeds: [
      embed(
        `${product.name} • ${field.name}\nDefinir Cargo Obrigatório`,
        [
          ':infogenesiss: Selecione o cargo necessário para comprar esta variação.',
          'Use o menu abaixo para selecionar ou clique em "Inserir ID" para digitar manualmente.',
        ].join('\n'),
        guild,
        'Selecione um cargo',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(id('cond-role-select', product.id, field.id))
          .setPlaceholder('Selecione o cargo obrigatório')
          .setMinValues(1)
          .setMaxValues(1),
      ),
      new ActionRowBuilder().addComponents(
        button(id('cond-role-id', product.id, field.id), 'Inserir ID', ButtonStyle.Secondary, EMOJI.title),
        button(id('field-conditions', product.id, field.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

function stockRemovePanel(guild, product, field) {
  const e = embed(
    'Remover itens do estoque',
    [
      `**Campo:** \`${field.name}\``,
      `**Total no estoque real:** \`${field.stock.length}\` itens`,
      '**Página:** `1/1`',
      field.stock.map((item, i) => `\`#${i + 1}\` ${item}`).join('\n'),
      ':infogenesiss: Selecione abaixo um ou mais itens para remover.',
      'Itens fantasma não aparecem aqui.',
    ].join('\n'),
    guild,
  );
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('stock-remove-select', product.id, field.id))
    .setPlaceholder(`Selecione os itens para remover (até ${Math.min(25, field.stock.length)})`)
    .setMinValues(1)
    .setMaxValues(Math.min(25, field.stock.length))
    .addOptions(field.stock.slice(0, 25).map((item, i) => ({ label: `#${i + 1} · ${item}`.slice(0, 100), value: String(i) })));
  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(button(id('stock', product.id, field.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

/** Controles de abertura: 1 função = botão | 2+ = select menu */
function ticketOpenControls(gs) {
  const funcoes = (gs.ticket.functions || []).slice(0, 25);

  if (!funcoes.length) {
    return { funcoes, actionRows: [] };
  }

  // Uma só categoria → botão direto
  if (funcoes.length === 1) {
    const item = funcoes[0];
    return {
      funcoes,
      actionRows: [
        new ActionRowBuilder().addComponents(
          button(
            id('ticket-open', item.id),
            item.name.slice(0, 80),
            ButtonStyle.Secondary,
            item.emoji || '📋',
          ),
        ),
      ],
    };
  }

  // Várias categorias → select menu
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('ticket-open-select'))
    .setPlaceholder('📋 Selecione a categoria do ticket')
    .addOptions(
      funcoes.map((item) => ({
        label: item.name.slice(0, 100),
        description: String(item.preDescription || item.description || 'Abrir ticket')
          .slice(0, 100),
        value: item.id,
        emoji: item.emoji || '📋',
      })),
    );

  return {
    funcoes,
    actionRows: [new ActionRowBuilder().addComponents(select)],
  };
}

function ticketOpeningPayload(guild, gs) {
  const { funcoes, actionRows } = ticketOpenControls(gs);

  if (gs.ticket.messageMode === 'Container V2') {
    const titulo = String(gs.ticket.title || 'Central de Atendimento').trim();
    const descricao = String(
      gs.ticket.description ||
        'Selecione uma opção abaixo para abrir um ticket com a equipe.',
    ).trim();
    const cor = parseHex(gs.ticket.color || '#5865F2');

    // Um único card V2: banner + texto + botão/select
    const card = new ContainerBuilder().setAccentColor(cor);

    if (gs.ticket.banner) {
      card.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(gs.ticket.banner),
        ),
      );
      card.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(1),
      );
    }

    const dica =
      funcoes.length === 0
        ? '\n-# Nenhuma categoria configurada ainda.'
        : funcoes.length === 1
          ? `\n-# Toque no botão para abrir · ${funcoes[0].name}`
          : `\n-# Escolha uma categoria no menu · ${funcoes.length} opções`;

    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [`### ${titulo}`, '', descricao, dica].join('\n'),
      ),
    );

    if (actionRows.length) {
      card.addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(1),
      );
      for (const row of actionRows) {
        card.addActionRowComponents(row);
      }
    }

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [card],
    };
  }

  const ticketEmbed = embed(gs.ticket.title, gs.ticket.description, guild).setColor(
    parseHex(gs.ticket.color || '#FFFFFF'),
  );
  if (gs.ticket.banner) ticketEmbed.setImage(gs.ticket.banner);
  return {
    embeds: [ticketEmbed],
    components: actionRows,
  };
}

function ticketPreview(guild, gs) {
  const opening = ticketOpeningPayload(guild, gs);
  // Components V2 não aceita `content` junto
  if (
    gs.ticket.messageMode === 'Container V2' ||
    (Number(opening.flags) & MessageFlags.IsComponentsV2)
  ) {
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [
        new TextDisplayBuilder().setContent(
          '👁️ **Preview** — assim a mensagem ficará no canal:',
        ),
        ...(opening.components || []),
      ],
    };
  }
  return {
    content: '👁️ Preview — É assim que a mensagem ficará no canal.',
    embeds: opening.embeds,
    components: opening.components,
  };
}

function ticketIsOpenNow(gs) {
  if (!gs.ticket.hoursEnabled) return true;
  const now = new Date();
  const day = gs.ticket.hoursByDay?.[now.getDay()];
  if (!day?.active) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const parseTime = (value) => {
    const [hour, minute] = String(value || '00:00').split(':').map(Number);
    return hour * 60 + minute;
  };
  return minutes >= parseTime(day.openAt) && minutes <= parseTime(day.closeAt);
}

function ticketInternalPayload(guild, gs, ticket, fn) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(id('ticket-panel-select', ticket.id))
    .setPlaceholder('📋 Selecione um painel de opções')
    .addOptions(
      { label: 'Painel Staff', description: 'Ferramentas exclusivas para a equipe', value: 'staff', emoji: '🛡️' },
      { label: 'Painel Membro', description: 'Opções disponíveis para você', value: 'member', emoji: '👤' },
    );
  const panel = embed(
    fn.name,
    `**${fn.name}**\n${fn.description || gs.ticket.description}`,
    guild,
  );
  if (gs.ticket.banner) panel.setImage(gs.ticket.banner);
  return {
    content: `<@${ticket.userId}>`,
    embeds: [panel],
    components: [
      new ActionRowBuilder().addComponents(menu),
      new ActionRowBuilder().addComponents(
        button(id('ticket-notify', ticket.id), 'Notificar', ButtonStyle.Primary, '🕘'),
        button(id('ticket-assume', ticket.id), 'Assumir Ticket', ButtonStyle.Secondary, '🎟️'),
      ),
      new ActionRowBuilder().addComponents(button(id('ticket-close', ticket.id), 'Deletar e Salvar', ButtonStyle.Danger, '🗑️')),
    ],
  };
}

async function createTicketChannel(interaction, gs, ticket) {
  if (gs.ticket.openMode === 'Thread Privada' && interaction.channel?.threads?.create) {
    const thread = await interaction.channel.threads.create({
      name: `ticket-${ticket.functionName}-${interaction.user.username}`.toLowerCase().slice(0, 90),
      type: ChannelType.PrivateThread,
      invitable: false,
      autoArchiveDuration: 1440,
      reason: `Ticket Zend de ${interaction.user.tag}`,
    }).catch(() => null);
    if (thread) {
      await thread.members.add(interaction.user.id).catch(() => null);
      return thread;
    }
  }

  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
  ];
  for (const roleId of [gs.roles?.staff, gs.roles?.manager].filter(Boolean)) {
    overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }
  return interaction.guild.channels.create({
    name: `ticket-${ticket.functionName}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90),
    type: ChannelType.GuildText,
    parent: interaction.channel?.parentId || undefined,
    permissionOverwrites: overwrites,
    reason: `Ticket Zend de ${interaction.user.tag}`,
  }).catch(() => null);
}

async function openTicket(interaction, gs, functionId, force = false) {
  const current = gs.tickets.find((item) => item.userId === interaction.user.id && item.status === 'open');
  if (current) {
    return interaction.reply({
      content: '❌ | Você já possui um ticket aberto.',
      components: current.channelId
        ? [new ActionRowBuilder().addComponents(linkButton(`https://discord.com/channels/${interaction.guild.id}/${current.channelId}`, 'Ir para o Ticket'))]
        : [],
      ephemeral: true,
    });
  }
  if (!force && !ticketIsOpenNow(gs)) {
    return interaction.reply({
      embeds: [embed(
        '⏰ Fora do Horário de Atendimento',
        'No momento nossa equipe não está disponível para atendimento.\n\n**Próximo atendimento:** `em breve` (Horário de brasília)\n\n🎟️ Você pode abrir seu ticket normalmente, mas a equipe responderá dentro do horário de funcionamento.',
        interaction.guild,
      ).setColor(0xffb300)],
      components: [new ActionRowBuilder().addComponents(
        button(id('ticket-open-force', functionId), 'Abrir Ticket Mesmo Assim', ButtonStyle.Primary, '🎟️'),
        button(id('ticket-open-cancel'), 'Cancelar', ButtonStyle.Secondary, '❌'),
      )],
      ephemeral: true,
    });
  }

  const fn = gs.ticket.functions.find((item) => item.id === functionId) || gs.ticket.functions[0];
  const ticket = {
    id: crypto.randomUUID(),
    userId: interaction.user.id,
    functionId: fn?.id || 'support',
    functionName: fn?.name || 'Suporte',
    status: 'open',
    at: Date.now(),
    channelId: null,
    assignedTo: null,
    guildId: interaction.guild.id,
  };
  const channel = await createTicketChannel(interaction, gs, ticket);
  if (!channel) return interaction.reply({ content: '❌ | Não foi possível criar o ticket. Verifique as permissões do bot.', ephemeral: true });
  ticket.channelId = channel.id;
  gs.tickets.push(ticket);
  await channel.send(ticketInternalPayload(interaction.guild, gs, ticket, fn || { name: 'Suporte', description: gs.ticket.description }));
  await sendConfiguredLog(interaction.guild, gs.channels.tickets, {
    embeds: [embed('Ticket criado', `**Usuário:** <@${ticket.userId}>\n**Categoria:** \`${ticket.functionName}\`\n**Canal:** <#${channel.id}>`, interaction.guild, 'Tickets').setColor(0x39fc03)],
  });
  return interaction.reply({
    content: '✅ | Ticket criado com sucesso!',
    components: [new ActionRowBuilder().addComponents(linkButton(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`, 'Ir para o Ticket'))],
    ephemeral: true,
  });
}

function ticketFunctionsPanel(guild, gs) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('ticket-function-select'))
    .setPlaceholder('📝 Selecione uma função para gerenciar')
    .setDisabled(!gs.ticket.functions.length);
  if (gs.ticket.functions.length) {
    select.addOptions(gs.ticket.functions.slice(0, 25).map((fn) => ({
      label: fn.name.slice(0, 100),
      description: (fn.preDescription || fn.description || 'Sem descrição').slice(0, 100),
      value: fn.id,
      emoji: fn.emoji || '📋',
    })));
  } else {
    select.addOptions({ label: 'Nenhuma função configurada', value: 'none' });
  }
  return {
    embeds: [embed(
      'zenSallers\n📋 Gerenciar Funções de Ticket',
      `Selecione uma função no menu abaixo para visualizar detalhes, editar ou remover.\n\n**Total de funções:** \`${gs.ticket.functions.length}x\``,
      guild,
      'Tickets',
    )],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(button(id('ticket-function-add'), 'Adicionar Função', ButtonStyle.Success, EMOJI.plus)),
      new ActionRowBuilder().addComponents(button(id('ticket'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function ticketFunctionDetailPanel(guild, fn) {
  const detail = embed(
    `zenSallers\n🎟️ Detalhes da Função`,
    [
      `**📋 Nome**\n\`${fn.name}\``,
      `**Emoji**\n\`${fn.emoji || 'Não configurado'}\``,
      `**📋 Pré-descrição**\n\`${fn.preDescription || 'Não configurada'}\``,
      `**ℹ️ Descrição Completa**\n\`${fn.description || 'Não configurada'}\``,
      `**Banner**\n\`${fn.banner ? 'Configurado' : 'Não configurado'}\``,
    ].join('\n'),
    guild,
    `ID: ${fn.id}`,
  );
  if (fn.banner) detail.setThumbnail(fn.banner);
  return {
    embeds: [detail],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('ticket-function-edit', fn.id), 'Editar Função', ButtonStyle.Primary, EMOJI.edit),
        button(id('ticket-function-delete', fn.id), 'Remover Função', ButtonStyle.Danger, EMOJI.trash),
      ),
      new ActionRowBuilder().addComponents(
        button(id('ticket-function-purchase', fn.id), `Detecção de compra: ${fn.purchaseDetection === false ? 'Desativada' : 'Ativada'}`, ButtonStyle.Secondary),
      ),
      new ActionRowBuilder().addComponents(button(id('ticket-functions'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function ticketOpenModePanel(guild, gs) {
  return {
    embeds: [embed(
      'zenSallers\n# Modo de Abertura de Tickets',
      [
        'Escolha como os tickets serão abertos no seu servidor.',
        '',
        '**💬 Thread Privada (Padrão)**',
        'Os tickets são abertos como threads privadas no canal onde está a mensagem de abertura.',
        '',
        '**📁 Canal Privado**',
        'Os tickets são abertos como canais de texto em uma categoria dedicada.',
        '',
        `**🎟️ Modo Atual**\n\`${gs.ticket.openMode}\``,
      ].join('\n'),
      guild,
      'Tickets',
    )],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('ticket-mode-thread'), 'Thread Privada', ButtonStyle.Secondary, '💬', gs.ticket.openMode === 'Thread Privada'),
        button(id('ticket-mode-channel'), 'Canal Privado', ButtonStyle.Secondary, '📁', gs.ticket.openMode === 'Canal Privado'),
      ),
      new ActionRowBuilder().addComponents(button(id('ticket'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function ticketHoursPanel(guild, gs) {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const configured = gs.ticket.hoursByDay || [];
  const activeCount = configured.filter((day) => day.active).length;
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('ticket-day'))
    .setPlaceholder('Selecione um dia da semana para configurar')
    .addOptions(days.map((label, index) => ({ label, value: String(index), emoji: '📅' })));
  return {
    embeds: [
      embed(
        'zenSallers\n⏱️ Configurar Horários de Atendimento',
        [
          'Configure os horários em que sua equipe estará disponível para atendimento via tickets.',
          '',
          '**Controle completo de disponibilidade!**',
          `**Status do Sistema**\n\`${gs.ticket.hoursEnabled ? '✅ Ativo' : '❌ Desativado'}\``,
          `**Horários Ativos**\n\`${activeCount}/7 dias\``,
          `**Abertura Fora do Horário**\n\`${gs.ticket.allowOutsideHours ? '🔓 Permitido' : '🔒 Bloqueado'}\``,
          '',
          '**Horários Configurados**',
          ...days.map((label, index) => {
            const day = configured[index];
            return `${day?.active ? '✅' : '❌'} **${label}:** \`${day?.active ? `${day.openAt} - ${day.closeAt}` : 'Inativo'}\``;
          }),
        ].join('\n'),
        guild,
        'Tickets',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        button(id('ticket-hours-toggle'), gs.ticket.hoursEnabled ? 'Desativar Sistema (Ativar 24h)' : 'Ativar Sistema de Horários', gs.ticket.hoursEnabled ? ButtonStyle.Danger : ButtonStyle.Success, '🟢'),
        button(id('ticket-hours-outside'), gs.ticket.allowOutsideHours ? 'Bloquear Fora do Horário' : 'Permitir Fora do Horário', gs.ticket.allowOutsideHours ? ButtonStyle.Danger : ButtonStyle.Success, '🔒'),
      ),
      new ActionRowBuilder().addComponents(
        button(id('ticket-hours-all'), 'Ativar todos os dias', ButtonStyle.Success, '✅'),
        button(id('ticket-hours-none'), 'Desativar todos os dias', ButtonStyle.Danger, '❌'),
      ),
      new ActionRowBuilder().addComponents(button(id('ticket'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

function ticketStatsPanel(guild, gs) {
  return {
    embeds: [
      embed(
        'zenSallers\nEstatísticas de Tickets',
        [
          `**Tickets abertos:** \`${gs.tickets.filter((ticket) => ticket.status === 'open').length}\``,
          `**Tickets arquivados:** \`${gs.tickets.filter((ticket) => ticket.status === 'archived').length}\``,
          `**Funções configuradas:** \`${gs.ticket.functions.length}\``,
          '**Tempo médio:** `Sem dados suficientes`',
          '**Staff em destaque:** `Sem dados suficientes`',
        ].join('\n'),
        guild,
        'Tickets',
      ),
    ],
    components: [new ActionRowBuilder().addComponents(button(id('ticket'), 'Voltar', ButtonStyle.Secondary, EMOJI.left))],
  };
}

function ticketHelpEmbed(guild) {
  return embed(
    'zenSallers\n:infogenesiss: Ajuda — Sistema de Tickets',
    [
      'Aqui está um resumo de cada opção de configuração:',
      '',
      '`➕` **Adicionar Função**',
      'Cria uma nova opção de atendimento (ex: Suporte, Compras, Reclamações). Cada função aparece no menu de abertura de ticket.',
      '`📋` **Gerenciar Funções**',
      'Visualize, edite ou remova funções existentes. Altere nome, descrição, emoji e banner de cada função.',
      '`🎨` **Configurar Aparência**',
      'Defina o título, descrição, cor e banner da mensagem de abertura de ticket que será postada no canal.',
      '`⏰` **Configurar Horários**',
      'Configure em quais dias e horários sua equipe estará disponível. Você pode bloquear ou apenas avisar quando estiver fora do horário.',
      '`📁` **Modo de Abertura**',
      'Escolha se os tickets serão abertos como **Thread Privada** ou **Canal Privado**.',
      '`📦/📋` **Modo de Mensagem**',
      'Alterne entre **Embed Clássico** e **Container V2**.',
      '`🔄` **Sincronizar Mensagens**',
      'Atualiza todas as mensagens de ticket já postadas.',
      '`📨` **Postar Mensagem**',
      'Envia uma nova mensagem de abertura de ticket em um canal.',
    ].join('\n'),
    guild,
    'Ajuda',
  );
}

function channelSelectRow(customId) {
  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder('Clique aqui para selecionar')
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
  );
}

function salePayload(product, gs) {
  const firstField = product.fields[0];
  const buyRow = new ActionRowBuilder().addComponents(
    button(id('buy', product.id), product.saleLabel || 'Comprar', saleButtonStyle(product.saleStyle), product.saleEmoji || EMOJI.carrinhoZend || '🛒'),
  );
  if (gs?.customization?.productMessages?.v2) {
    const stock = firstField ? stockCount(firstField) : 0;
    const components = [];
    if (product.banner) {
      components.push(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(product.banner),
        ),
      );
    }
    components.push(
      new ContainerBuilder()
        .setAccentColor(
          parseHex(
            gs?.customization?.productMessages?.sideColor ||
              product.saleColor ||
              '#5865F2',
          ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              `### ${product.name}`,
              product.autoDelivery ? '⚡ **Entrega Automática!**' : '',
              product.description || '',
              '',
              `**${firstField?.name || 'Produto'}**`,
              `**Valor à vista**  \`${money(firstField?.price || 0)}\``,
              `**Restam**  \`${Number.isFinite(stock) ? stock : '∞'}\``,
            ]
              .filter((line) => line !== '')
              .join('\n'),
          ),
        ),
      buyRow,
    );
    // Payload limpo V2 — sem content/embeds
    return {
      flags: MessageFlags.IsComponentsV2,
      components,
    };
  }
  const titleRow = ['ea1', 'ea2', 'ea3', 'ea4', 'ea5', 'ea6', 'ea7', 'ea8'].map((key) => EMOJI[key]).filter(Boolean).join('');
  const e = new EmbedBuilder()
    .setColor(parseHex(product.saleColor || '#FFFFFF'))
    .setAuthor({ name: product.name })
    .setTitle(titleRow || product.name)
    .setDescription(product.autoDelivery ? '⚡ **Entrega Automática!**' : null)
    .addFields(
      {
        name: 'Valor à vista',
        value: `\`${money(firstField?.price || 0)}\``,
        inline: true,
      },
      {
        name: 'Restam',
        value: `\`${firstField ? stockCount(firstField) : 0}\``,
        inline: true,
      },
    )
    .setFooter({ text: CREDIT_TAG })
    .setTimestamp();
  if (product.banner) e.setImage(product.banner);
  return {
    embeds: [e],
    components: [buyRow],
  };
}

function saleButtonStyle(style) {
  const clean = String(style || 'verde').toLowerCase();
  if (clean.includes('azul') || clean.includes('primary')) return ButtonStyle.Primary;
  if (clean.includes('vermelho') || clean.includes('danger')) return ButtonStyle.Danger;
  if (clean.includes('cinza') || clean.includes('secondary')) return ButtonStyle.Secondary;
  return ButtonStyle.Success;
}

function parsePrice(value) {
  return Number(String(value || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
}

  return {
    mainPanel,
    productListPanel,
    storePanel,
    positionsPanel,
    positionPanel,
    balancePanel,
    storeCouponsPanel,
    badgesPanel,
    tempRolePanel,
    storeOauthPanel,
    draftProductPanel,
    productSummary,
    productPanel,
    stockCount,
    fieldsPanel,
    fieldPanel,
    fieldEmojiPanel,
    stockPanel,
    couponsPanel,
    ticketPanel,
    welcomePanel,
    automationsPanel,
    repostPanel,
    automationFeaturePanel,
    customPanel,
    customDetailPanel,
    statementPanel,
    statementPeriodPanel,
    statementHistoryPanel,
    statementChartPanel,
    giveawayPanel,
    giveawayDraftPanel,
    giveawayDurationLabel,
    giveawayDurationPanel,
    giveawayChannelPanel,
    giveawayRolesPanel,
    giveawayExtrasPanel,
    giveawayMessagePayload,
    giveawayManagePanel,
    giveawayDetailPanel,
    finishGiveaway,
    scheduleGiveaway,
    parseDuration,
    settingsPanel,
    rolesConfigPanel,
    roleSelectionPanel,
    channelsPanel,
    channelSelectionPanel,
    zenWalletPanel,
    paymentsPanel,
    manualPaymentPanel,
    gatewayPaymentPanel,
    antiFakePanel,
    cloudPanel,
    oauthPanel,
    oauthConfigPanel,
    oauthRolePanel,
    protectPanel,
    protectDetailPanel,
    protectSelfBotPanel,
    protectAntiInvitePanel,
    protectChannelSelectionPanel,
    protectWhitelistPanel,
    simplePanel,
    rolesFieldPanel,
    fieldRolePickerPanel,
    conditionsPanel,
    conditionRolePickerPanel,
    stockRemovePanel,
    ticketOpeningPayload,
    ticketPreview,
    ticketIsOpenNow,
    ticketInternalPayload,
    createTicketChannel,
    openTicket,
    ticketFunctionsPanel,
    ticketFunctionDetailPanel,
    ticketOpenModePanel,
    ticketHoursPanel,
    ticketStatsPanel,
    ticketHelpEmbed,
    channelSelectRow,
    salePayload,
    saleButtonStyle,
    parsePrice,
  };
}
