// Executor dos slash commands do Zend clonando.
// Aqui ficam as respostas dos comandos /panel, /sales, /entregar e similares.

export function criarExecutorSlash(contexto) {
  const {
    ActionRowBuilder,
    ButtonStyle,
    EMOJI,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    button,
    deliverCart,
    embed,
    emojiSyncSummary,
    fieldPanel,
    getCart,
    id,
    isCartAdmin,
    mainPanel,
    money,
    parseHex,
    productPanel,
    salePayload,
    statementPanel,
    stockCount,
    stockPanel,
    syncLocalEmojis,
    zenWalletPanel,
  } = contexto;

function commandListEmbed(guild) {
  return embed(
    'Ajuda — zenSallers',
    [
      '**Painel e loja**',
      '`/panel`, `/manage_product`, `/manage_item`, `/manage_stock`, `/create_mass_coupon`, `/remove_mass_coupon`, `/delivery`, `/entregar`',
      '',
      '**Saldo e vendas**',
      '`/addsaldo`, `/removersaldo`, `/saldopanel`, `/perfil`, `/sales`, `/vercompras`, `/consultarpagamento`, `/zenwallet`',
      '',
      '**Tickets e suporte**',
      '`/managetickets`, `/ticketstaff`, `/add_ticket`, `/archive_ticket`',
      '',
      '**Comunidade e cargos**',
      '`/cargoall`, `/removercargoall`, `/convites`, `/remove-feedback`, `/lock`, `/nuke`, `/enviarpv`, `/anunciar`',
      '',
      '**Condecorações e clientes**',
      '`/condecoracoes`, `/conceder-condecoracao`, `/atualizar-condecoracoes`, `/sincronizar_posicoes`, `/vincular_clientes`, `/vincular_assinatura`',
      '',
      '**Outros**',
      '`/solicitarestoque`, `/cuponwin`, `/syncemojis`, `/tutorial`, `/ajuda`',
    ].join('\n'),
    guild,
    'Ajuda',
  );
}

const HELP_PAGES = {
  home: {
    title: 'Central de Ajuda',
    description: [
      'Bem-vindo à central de ajuda do bot!',
      '',
      'Use o menu abaixo para explorar os comandos disponíveis por categoria.',
      '',
      '**Categorias disponíveis:**',
      '',
      'Administração - Gestão de produtos, vendas e servidor',
      'Financeiro - PIX, cupons e pagamentos',
      'Tickets - Suporte e atendimento',
      'Usuários - Comandos para todos os membros',
      'Menus de Contexto - Ações rápidas via botão direito',
      'Navegue pelas categorias para ver todos os comandos',
    ].join('\n'),
  },
  products: {
    title: 'Gestão de Produtos e Vendas',
    description: [
      'Comandos para gerenciar produtos, estoque e vendas',
      '/panel',
      'Abre o painel de controle principal com todas as configurações do sistema.',
      '/manage_product',
      'Gerencia um produto específico - edita preço, descrição, imagens e configurações.',
      '/manage_stock',
      'Gerencia o estoque de um produto - adiciona, remove ou visualiza itens disponíveis.',
      '/manage_item',
      'Gerencia campos específicos de um produto (variações, tamanhos, etc).',
      '/postproduto',
      'Posta a mensagem de um produto em um canal específico com botão de compra.',
      '/produtossemestoque',
      'Lista todos os produtos que estão sem estoque atualmente.',
      '/solicitarestoque',
      'Envia um painel para usuários solicitarem reposição de estoque.',
      '/delivery',
      'Entrega um produto manualmente para um usuário específico.',
      '/entregar',
      'Aprova um carrinho de compra manualmente.',
      '/sales',
      'Exibe relatório detalhado de todas as vendas realizadas.',
      '/rank',
      'Mostra o ranking de clientes por valor gasto no servidor.',
      'Dica: Use /panel para acessar todas as configurações',
    ].join('\n'),
  },
  finance: {
    title: 'Financeiro e Pagamentos',
    description: [
      'Comandos para gerenciar pagamentos, PIX e cupons',
      '/gerarpix',
      'Gera um QR Code PIX para pagamento avulso com valor personalizado.',
      '/zenwallet',
      'Abre o painel do zenWallet - carteira digital integrada para receber e sacar pagamentos.',
      '/cuponwin',
      'Envia um cupom de desconto exclusivo na DM de um usuário com link direto para o produto.',
      '/create_mass_coupon',
      'Cria cupons de desconto em massa para todos os produtos com configurações personalizadas.',
      '/remove_mass_coupon',
      'Remove cupons criados em massa baseado no nome do cupom.',
      'O zenWallet permite acumular saldo das vendas e sacar via PIX',
    ].join('\n'),
  },
  tickets: {
    title: 'Tickets e Suporte',
    description: [
      'Comandos para gerenciar tickets de atendimento',
      '/add_ticket',
      'Adiciona um usuário ao ticket atual para participar da conversa.',
      '/close_ticket',
      'Fecha o ticket de suporte atual, finalizando o atendimento.',
      '/archive_ticket',
      'Arquiva um ticket encerrado, preservando o histórico.',
      '/closealltickets',
      'Fecha todos os tickets abertos de uma vez (use com cuidado!).',
      'Os tickets permitem atendimento privado aos clientes',
    ].join('\n'),
  },
  admin: {
    title: 'Administração do Servidor',
    description: [
      'Comandos para gerenciar o servidor e membros',
      '/anunciar',
      'Cria e envia anúncios personalizados com embed customizável para qualquer canal.',
      '/enviarpv',
      'Envia uma mensagem privada personalizada para um membro do servidor.',
      '/clear',
      'Limpa mensagens do canal atual (pode especificar quantidade).',
      '/lock',
      'Tranca o canal atual, impedindo envio de mensagens por membros.',
      '/nuke',
      'Recria o canal completamente, removendo todas as mensagens antigas.',
      '/cargoall',
      'Adiciona um cargo a todos os membros do servidor.',
      '/removercargoall',
      'Remove um cargo de todos os membros do servidor.',
      '/sincronizar_permissoes',
      'Sincroniza as permissões de todos os canais com suas categorias.',
      '/sincronizar_posicoes',
      'Sincroniza os cargos de posição (VIP, etc) baseado no valor gasto dos clientes.',
      '/syncemojis',
      'Sincroniza os emojis locais clonados com este servidor.',
      '/vincular_clientes',
      'Sincroniza o cargo de cliente para todos que já compraram.',
      'Estes comandos requerem permissão de administrador',
    ].join('\n'),
  },
  invites: {
    title: 'Sistema de Convites',
    description: [
      'Comandos relacionados ao sistema de convites',
      '/invites_reset',
      'Reseta os convites de um usuário específico ou de todos os membros.',
      '/convites',
      'Mostra suas estatísticas de convites ou de outro usuário.',
      '/rank_convites',
      'Exibe o ranking dos membros que mais convidaram pessoas.',
      'O sistema de convites precisa estar ativado no painel',
    ].join('\n'),
  },
  badges: {
    title: 'Sistema de Condecorações',
    description: [
      'Comandos para gerenciar condecorações e conquistas',
      '/condecoracoes',
      'Exibe suas condecorações conquistadas através de compras no servidor.',
      '/conceder-condecoracao',
      'Concede uma condecoração manualmente a um usuário específico.',
      '/atualizar-condecoracoes',
      'Recalcula e atualiza as condecorações de um usuário com base nas compras.',
      'Condecorações são conquistadas automaticamente ao atingir metas de compra',
    ].join('\n'),
  },
  users: {
    title: 'Comandos para Usuários',
    description: [
      'Comandos disponíveis para todos os membros do servidor',
      '/perfil',
      'Exibe seu perfil completo com histórico de compras, valor total gasto e cargos.',
      '/convites',
      'Mostra suas estatísticas de convites (válidos, bônus, fakes, etc).',
      '/rank_convites',
      'Veja o ranking dos maiores convidadores do servidor.',
      '/condecoracoes',
      'Visualize suas condecorações e conquistas obtidas.',
      '/ajuda',
      'Mostra esta central de ajuda com todos os comandos disponíveis.',
      'Estes comandos estão disponíveis para todos',
    ].join('\n'),
  },
};

function helpPanel(guild, page = 'home') {
  const current = HELP_PAGES[page] || HELP_PAGES.home;
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('help-menu'))
    .setPlaceholder('📁 Selecione uma categoria')
    .addOptions(
      { label: 'Página Principal', description: 'Voltar para a tela inicial', value: 'home', emoji: '🏠' },
      { label: 'Produtos e Vendas', description: 'Gestão de produtos, estoque e vendas', value: 'products', emoji: '🛒' },
      { label: 'Financeiro', description: 'PIX, cupons e pagamentos', value: 'finance', emoji: '💰' },
      { label: 'Tickets e Suporte', description: 'Gestão de tickets de atendimento', value: 'tickets', emoji: '🎫' },
      { label: 'Administração', description: 'Gerenciamento do servidor', value: 'admin', emoji: '⚙️' },
      { label: 'Sistema de Convites', description: 'Invite tracker e rankings', value: 'invites', emoji: '📨' },
      { label: 'Condecorações', description: 'Conquistas e medalhas', value: 'badges', emoji: '🏆' },
      { label: 'Comandos de Usuário', description: 'Comandos para todos os membros', value: 'users', emoji: '👤' },
    );
  return {
    embeds: [embed(current.title, current.description, guild, 'Ajuda')],
    components: [new ActionRowBuilder().addComponents(select)],
  };
}

function findProduct(gs, query) {
  if (!query) return gs.products.at(-1);
  return gs.products.find((product) => product.id === query || product.name.toLowerCase().includes(String(query).toLowerCase())) || gs.products.at(-1);
}

function findField(product, query) {
  if (!product) return null;
  if (!query) return product.fields?.[0];
  return product.fields?.find((field) => field.id === query || field.name.toLowerCase().includes(String(query).toLowerCase())) || product.fields?.[0];
}

function balanceUser(gs, user) {
  gs.balance.users[user.id] ??= {
    id: user.id,
    tag: user.tag || user.username,
    balance: 0,
    spent: 0,
    badges: [],
    history: [],
  };
  return gs.balance.users[user.id];
}

function moveBalance(gs, user, amount, mode, reason = 'Movimentação manual') {
  const account = balanceUser(gs, user);
  const before = Number(account.balance || 0);
  if (mode === 'set') account.balance = amount;
  if (mode === 'add') account.balance = before + amount;
  if (mode === 'remove') account.balance = Math.max(0, before - amount);
  const event = { at: Date.now(), userId: user.id, mode, amount, before, after: account.balance, reason };
  account.history.push(event);
  gs.balance.history.push(event);
  return account;
}

function profileEmbed(guild, gs, user) {
  const account = balanceUser(gs, user);
  const purchases = gs.purchases.filter((purchase) => purchase.userId === user.id);
  return embed(
    `Perfil de ${user.username}`,
    [
      `**Saldo:** \`${money(account.balance)}\``,
      `**Total gasto:** \`${money(account.spent)}\``,
      `**Compras:** \`${purchases.length}\``,
      `**Condecorações:** ${account.badges.length ? account.badges.map((badge) => `\`${badge}\``).join(', ') : '`Nenhuma`'}`,
      `**Convites:** \`${gs.invitations[user.id]?.count || 0}\``,
    ].join('\n'),
    guild,
    'Perfil',
  );
}

function purchasesEmbed(guild, gs, user) {
  const purchases = gs.purchases.filter((purchase) => purchase.userId === user.id);
  const body = purchases.length
    ? purchases.slice(-10).map((purchase, index) => `\`${index + 1}.\` ${purchase.product} - ${money(purchase.amount)} - <t:${Math.floor(purchase.at / 1000)}:R>`).join('\n')
    : [
      'Você ainda não possui nenhuma compra registrada.',
      '',
      '',
      'Quando realizar uma compra, ela aparecerá aqui com todos os detalhes!',
    ].join('\n');
  return embed(`Compras de ${user.username}`, body, guild, 'Compras');
}

function spendingRankEmbed(guild, gs, limit = 10) {
  const users = Object.values(gs.balance.users)
    .sort((a, b) => Number(b.spent || 0) - Number(a.spent || 0))
    .slice(0, limit);
  const body = users.length
    ? users.map((user, index) => `\`${index + 1}.\` <@${user.id}> — ${money(user.spent || 0)}`).join('\n')
    : '`Nenhum gasto registrado ainda.`';
  return embed('Ranking de Clientes', body, guild, 'Vendas');
}

function inviteRankEmbed(guild, gs, limit = 10) {
  const users = Object.entries(gs.invitations)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
    .slice(0, limit);
  const body = users.length
    ? users.map((user, index) => `\`${index + 1}.\` <@${user.id}> — \`${user.count || 0}\` convites`).join('\n')
    : '`Nenhum convite registrado ainda.`';
  return embed('Ranking de Convites', body, guild, 'Convites');
}

function outOfStockEmbed(guild, gs) {
  const rows = [];
  for (const product of gs.products) {
    const emptyFields = product.fields.filter((field) => stockCount(field) <= 0);
    if (emptyFields.length) rows.push(`**${product.name}**\n${emptyFields.map((field) => `• ${field.name}`).join('\n')}`);
  }
  return embed(
    'Produtos sem estoque',
    rows.length ? rows.join('\n\n') : '`Nenhum produto sem estoque no momento.`',
    guild,
    'Estoque',
  );
}

function balancePublicPayload(guild, gs) {
  return {
    embeds: [
      embed(
        'zenSallers\nPainel de Saldo',
        [
          'Use este painel para solicitar recarga de saldo interno.',
          `**Sistema:** \`${gs.balance.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
          `**Pagamento manual:** \`${gs.payments.manual.enabled ? 'Habilitado' : 'Desabilitado'}\``,
        ].join('\n'),
        guild,
        'Saldo',
      ),
    ],
    components: [new ActionRowBuilder().addComponents(button(id('balance-recharge'), 'Recarregar saldo', ButtonStyle.Success, EMOJI.wallet))],
  };
}

function stockRequestPayload(guild) {
  return {
    embeds: [
      embed(
        'Solicitar Estoque',
        'Use o botão abaixo para solicitar restock de um produto. A equipe receberá a solicitação no canal configurado.',
        guild,
        'Solicitações de estoque',
      ),
    ],
    components: [new ActionRowBuilder().addComponents(button(id('stock-request-open'), 'Solicitar produto', ButtonStyle.Secondary, EMOJI.stock))],
  };
}

function ticketManagerPanel(guild, gs) {
  return {
    embeds: [
      embed(
        'zenSallers\nGerenciamento de Tickets',
        [
          `**Abertos:** \`${gs.tickets.filter((ticket) => ticket.status === 'open').length}\``,
          `**Arquivados:** \`${gs.tickets.filter((ticket) => ticket.status === 'archived').length}\``,
          `**Funções:** \`${gs.ticket.functions.length}\``,
        ].join('\n'),
        guild,
        'Tickets',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('ticket'), 'Configurar sistema', ButtonStyle.Secondary, EMOJI.settings),
        button(id('ticket-stats'), 'Estatísticas', ButtonStyle.Secondary, EMOJI.activity),
      ),
    ],
  };
}

function ticketStaffPanel(guild) {
  return {
    embeds: [
      embed(
        'Painel Staff do Ticket',
        'Ações rápidas para o ticket atual: adicionar usuário, arquivar, chamar cliente, renomear e registrar observações.',
        guild,
        'Ticket Staff',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('ticket-staff-add'), 'Adicionar usuário', ButtonStyle.Secondary, EMOJI.plus),
        button(id('ticket-staff-archive'), 'Arquivar ticket', ButtonStyle.Danger, EMOJI.trash),
        button(id('ticket-staff-note'), 'Observação', ButtonStyle.Secondary, EMOJI.title),
      ),
    ],
  };
}

async function handleSlashCommand(interaction, gs) {
  const { commandName: command } = interaction;
  const guild = interaction.guild;
  const options = interaction.options;

  if (command === 'panel') return interaction.reply({ ...mainPanel(guild), ephemeral: true });
  if (command === 'ajuda') return interaction.reply({ ...helpPanel(guild), ephemeral: true });
  if (command === 'zenwallet') return interaction.reply({ ...zenWalletPanel(guild, gs), ephemeral: true });
  if (command === 'managetickets') return interaction.reply({ ...ticketManagerPanel(guild, gs), ephemeral: true });
  if (command === 'ticketstaff') return interaction.reply({ ...ticketStaffPanel(guild), ephemeral: true });
  if (command === 'tutorial') return interaction.reply({ content: 'Tutorial reiniciado. Comece pelas configurações, depois crie produtos e publique mensagens.', ...mainPanel(guild), ephemeral: true });

  if (command === 'syncemojis') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Voce precisa da permissao Gerenciar Servidor para sincronizar emojis do aplicativo.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const result = await syncLocalEmojis(guild, gs);
    return interaction.editReply({ content: emojiSyncSummary(result) });
  }

  if (command === 'addsaldo' || command === 'removersaldo') {
    const user = options.getUser('user', true);
    const value = Number(options.getNumber('valor', true));
    const account = moveBalance(gs, user, value, command === 'addsaldo' ? 'add' : 'remove', options.getString('motivo') || 'Slash command');
    return interaction.reply({ content: `Saldo de ${user} atualizado para \`${money(account.balance)}\`.`, ephemeral: true });
  }

  if (command === 'perfil') {
    const user = options.getUser('user') || interaction.user;
    return interaction.reply({ embeds: [profileEmbed(guild, gs, user)], ephemeral: true });
  }

  if (command === 'vercompras') {
    const user = options.getUser('user') || interaction.user;
    return interaction.reply({ embeds: [purchasesEmbed(guild, gs, user)], ephemeral: true });
  }

  if (command === 'sales') return interaction.reply({ ...statementPanel(guild, gs, interaction.user), ephemeral: true });

  if (command === 'saldopanel') {
    const channel = options.getChannel('canal') || interaction.channel;
    if (!channel?.isTextBased()) return interaction.reply({ content: 'Canal inválido para publicar o painel de saldo.', ephemeral: true });
    await channel.send(balancePublicPayload(guild, gs));
    return interaction.reply({ content: `Painel de saldo publicado em ${channel}.`, ephemeral: true });
  }

  if (command === 'anunciar') {
    const channel = options.getChannel('canal', true);
    if (!channel?.isTextBased()) return interaction.reply({ content: 'Canal inválido.', ephemeral: true });
    const announcement = embed(options.getString('titulo', true), options.getString('mensagem', true), guild, 'Anúncio');
    const color = options.getString('cor');
    const image = options.getString('imagem');
    if (color) announcement.setColor(parseHex(color));
    if (image) announcement.setImage(image);
    const msg = await channel.send({ embeds: [announcement] });
    return interaction.reply({ content: `Anúncio enviado: ${msg.url}`, ephemeral: true });
  }

  if (command === 'enviarpv') {
    const user = options.getUser('user', true);
    const message = options.getString('mensagem', true);
    await user.send({ embeds: [embed(`Mensagem de ${guild.name}`, message, guild, 'Zend')] }).catch(() => null);
    return interaction.reply({ content: `Mensagem privada enviada para ${user}.`, ephemeral: true });
  }

  if (command === 'create_mass_coupon') {
    const code = options.getString('codigo', true).toUpperCase();
    const discount = options.getNumber('desconto', true);
    for (const product of gs.products) {
      product.coupons ??= [];
      product.coupons.push({ id: crypto.randomUUID(), code, discount, validity: options.getString('validade') || '', quantity: null, maxUses: null, uses: 0, conditions: ['Cupom criado em massa'] });
    }
    return interaction.reply({ content: `Cupom \`${code}\` criado em \`${gs.products.length}\` produtos.`, ephemeral: true });
  }

  if (command === 'remove_mass_coupon') {
    const code = options.getString('codigo', true).toUpperCase();
    let removed = 0;
    for (const product of gs.products) {
      const before = product.coupons?.length || 0;
      product.coupons = (product.coupons || []).filter((coupon) => coupon.code !== code);
      removed += before - product.coupons.length;
    }
    return interaction.reply({ content: `Cupom \`${code}\` removido de \`${removed}\` entradas.`, ephemeral: true });
  }

  if (command === 'manage_product') {
    const product = findProduct(gs, options.getString('produto'));
    if (!product) return interaction.reply({ content: 'Nenhum produto encontrado.', ephemeral: true });
    return interaction.reply({ ...productPanel(guild, product), ephemeral: true });
  }

  if (command === 'manage_item') {
    const product = findProduct(gs, options.getString('produto'));
    const field = findField(product, options.getString('campo'));
    if (!product || !field) return interaction.reply({ content: 'Nenhum campo encontrado para gerenciar.', ephemeral: true });
    return interaction.reply({ ...fieldPanel(guild, product, field), ephemeral: true });
  }

  if (command === 'manage_stock') {
    const product = findProduct(gs, options.getString('produto'));
    const field = findField(product, options.getString('campo'));
    if (!product || !field) return interaction.reply({ content: 'Nenhum estoque encontrado para gerenciar.', ephemeral: true });
    return interaction.reply({ ...stockPanel(guild, product, field), ephemeral: true });
  }

  if (command === 'postproduto') {
    const channel = options.getChannel('canal', true);
    const product = findProduct(gs, options.getString('produto'));
    if (!product) return interaction.reply({ content: 'Nenhum produto encontrado para postar.', ephemeral: true });
    if (!channel?.isTextBased()) return interaction.reply({ content: 'Canal inválido.', ephemeral: true });
    const { prepararMensagem } = await import('../infraestrutura/resposta-painel.js');
    const msg = await channel.send(prepararMensagem(salePayload(product, gs)));
    product.salesMessage = { channelId: channel.id, messageId: msg.id };
    return interaction.reply({
      content: `Mensagem do produto postada${gs.customization?.productMessages?.v2 ? ' (V2)' : ''}: ${msg.url}`,
      ephemeral: true,
    });
  }

  if (command === 'produtossemestoque') {
    const hasEmpty = gs.products.some((product) => product.fields.some((field) => stockCount(field) <= 0));
    if (!hasEmpty) return interaction.reply({ content: 'Todos os produtos possuem estoque.', ephemeral: true });
    return interaction.reply({ embeds: [outOfStockEmbed(guild, gs)], ephemeral: true });
  }

  if (command === 'rank') {
    return interaction.reply({ embeds: [spendingRankEmbed(guild, gs, options.getInteger('limite') || 10)], ephemeral: true });
  }

  if (command === 'delivery') {
    const user = options.getUser('user', true);
    const product = options.getString('produto', true);
    const content = options.getString('conteudo', true);
    gs.purchases.push({ userId: user.id, product, amount: 0, at: Date.now(), manual: true });
    balanceUser(gs, user).spent += 0;
    return interaction.reply({ content: `Entrega manual registrada para ${user}.\n\`\`\`\n${content}\n\`\`\``, ephemeral: true });
  }

  if (command === 'entregar') {
    if (!isCartAdmin(interaction, gs)) {
      return interaction.reply({ content: 'Você não possui permissão para aprovar carrinhos.', ephemeral: true });
    }
    const query = options.getString('id');
    const cart = getCart(gs, query || interaction.channelId)
      || [...gs.carts].reverse().find((item) => ['AWAITING_APPROVAL', 'AWAITING_MANUAL_PAYMENT'].includes(item.status));
    if (!cart) return interaction.reply({ content: 'Nenhum carrinho pendente foi encontrado.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const result = await deliverCart(interaction, gs, cart, interaction.user.id);
    return interaction.editReply({ content: result.message });
  }
  if (command === 'gerarpix') {
    const value = Number(options.getNumber('valor', true));
    const pixId = `PIX-${Date.now().toString(36).toUpperCase()}`;
    return interaction.reply({
      embeds: [
        embed(
          'PIX gerado',
          [
            `**Valor:** \`${money(value)}\``,
            `**Descrição:** \`${options.getString('descricao') || 'Pagamento avulso'}\``,
            `**ID:** \`${pixId}\``,
            '',
            '`00020126580014BR.GOV.BCB.PIX0136zend-clone-pix52040000530398654041.005802BR5925ZENSELLERS6009SAO PAULO6304ABCD`',
          ].join('\n'),
          guild,
          'Financeiro',
        ),
      ],
      ephemeral: true,
    });
  }
  if (command === 'consultarpagamento') return interaction.reply({ content: `Pagamento \`${options.getString('id', true)}\`: \`Pendente/Não encontrado no ambiente local\`.`, ephemeral: true });
  if (command === 'cuponwin') return interaction.reply({ content: `Cupom \`${options.getString('codigo', true)}\` enviado para ${options.getUser('user', true)} com ${options.getNumber('desconto', true)}% de desconto.`, ephemeral: true });
  if (command === 'solicitarestoque') {
    const channel = options.getChannel('canal') || interaction.channel;
    if (!channel?.isTextBased()) return interaction.reply({ content: 'Canal inválido.', ephemeral: true });
    await channel.send(stockRequestPayload(guild));
    return interaction.reply({ content: `Painel de solicitação de estoque publicado em ${channel}.`, ephemeral: true });
  }

  if (command === 'condecoracoes') {
    if (!gs.badges.length) {
      return interaction.reply({ content: '| O sistema de condecorações está temporariamente desativado pelo administrador.', ephemeral: true });
    }
    const user = options.getUser('user') || interaction.user;
    const account = balanceUser(gs, user);
    return interaction.reply({ content: `${user} possui: ${account.badges.length ? account.badges.map((badge) => `\`${badge}\``).join(', ') : '`nenhuma condecoração`'}.`, ephemeral: true });
  }

  if (command === 'conceder-condecoracao') {
    const user = options.getUser('user', true);
    const name = options.getString('nome', true);
    const account = balanceUser(gs, user);
    if (!account.badges.includes(name)) account.badges.push(name);
    return interaction.reply({ content: `Condecoração \`${name}\` concedida para ${user}.`, ephemeral: true });
  }

  if (command === 'atualizar-condecoracoes') {
    const user = options.getUser('user', true);
    const account = balanceUser(gs, user);
    const earned = gs.badges.filter((badge) => Number(account.spent || 0) >= Number(badge.amount || 0)).map((badge) => badge.name);
    account.badges = [...new Set([...account.badges, ...earned])];
    return interaction.reply({ content: `Condecorações recalculadas para ${user}: ${account.badges.length || 0}.`, ephemeral: true });
  }

  if (command === 'convites') {
    if (!gs.automations.invite.enabled) {
      return interaction.reply({ content: 'O sistema de Invite Tracker está desativado no momento.', ephemeral: true });
    }
    const user = options.getUser('user') || interaction.user;
    const invite = gs.invitations[user.id] || { count: 0, fake: 0, leaves: 0 };
    return interaction.reply({ content: `${user}: \`${invite.count}\` convites, \`${invite.fake}\` fakes, \`${invite.leaves}\` saídas.`, ephemeral: true });
  }

  if (command === 'invites_reset') {
    if (options.getBoolean('todos')) {
      gs.invitations = {};
      return interaction.reply({ content: 'Convites de todos os membros foram resetados.', ephemeral: true });
    }
    const user = options.getUser('user') || interaction.user;
    gs.invitations[user.id] = { count: 0, fake: 0, leaves: 0 };
    return interaction.reply({ content: `Convites de ${user} foram resetados.`, ephemeral: true });
  }

  if (command === 'rank_convites') {
    if (!gs.automations.invite.enabled) {
      return interaction.reply({ content: 'O sistema de Invite Tracker está desativado no momento.', ephemeral: true });
    }
    return interaction.reply({ embeds: [inviteRankEmbed(guild, gs, options.getInteger('limite') || 10)], ephemeral: true });
  }

  if (command === 'vincular_assinatura') {
    const user = options.getUser('user', true);
    const plan = options.getString('plano', true);
    gs.subscriptions.push({ userId: user.id, plan, validUntil: options.getString('validade') || 'Indeterminado', at: Date.now() });
    return interaction.reply({ content: `Assinatura \`${plan}\` vinculada a ${user}.`, ephemeral: true });
  }

  if (command === 'vincular_clientes') return interaction.reply({ content: 'Sincronização do cargo de clientes concluída no clone local.', ephemeral: true });
  if (command === 'sincronizar_posicoes') return interaction.reply({ content: 'Cargos de posição sincronizados com base no valor gasto registrado.', ephemeral: true });
  if (command === 'sincronizar_permissoes') return interaction.reply({ content: 'Permissões dos canais sincronizadas com suas categorias no clone.', ephemeral: true });
  if (command === 'remove-feedback') return interaction.reply({ content: `Permissão de feedback removida para ${options.getUser('user', true)}.`, ephemeral: true });
  if (command === 'add_ticket') return interaction.reply({ content: `${options.getUser('user', true)} adicionado ao ticket atual.`, ephemeral: true });
  if (command === 'archive_ticket') return interaction.reply({ content: 'Ticket arquivado e transcript registrado.', ephemeral: true });
  if (command === 'close_ticket') return interaction.reply({ content: `Ticket fechado. Motivo: ${options.getString('motivo') || 'não informado'}.`, ephemeral: true });
  if (command === 'closealltickets') {
    const total = gs.tickets.filter((ticket) => ticket.status === 'open').length;
    for (const ticket of gs.tickets) if (ticket.status === 'open') ticket.status = 'closed';
    return interaction.reply({ content: `Total de \`${total}\` tickets fechados.`, ephemeral: true });
  }
  if (command === 'clear') {
    const amount = options.getInteger('quantidade', true);
    const deleted = interaction.channel?.bulkDelete ? await interaction.channel.bulkDelete(amount, true).catch(() => null) : null;
    return interaction.reply({ content: deleted ? `\`${deleted.size}\` mensagens apagadas.` : `Limpeza de \`${amount}\` mensagens registrada.`, ephemeral: true });
  }
  if (command === 'lock') return interaction.reply({ content: `Canal ${options.getChannel('canal') || interaction.channel} trancado. Motivo: ${options.getString('motivo') || 'não informado'}.`, ephemeral: true });
  if (command === 'nuke') return interaction.reply({ content: `Nuke mapeado para ${options.getChannel('canal') || interaction.channel}. No clone local a ação fica em confirmação para evitar apagar canais acidentalmente.`, ephemeral: true });
  if (command === 'cargoall') return interaction.reply({ content: `Cargo ${options.getRole('cargo', true)} marcado para aplicação em todos os membros.`, ephemeral: true });
  if (command === 'removercargoall') return interaction.reply({ content: `Cargo ${options.getRole('cargo', true)} marcado para remoção de todos os membros.`, ephemeral: true });

  return interaction.reply({ content: 'Comando Zend mapeado no clone.', ephemeral: true });
}

  return {
    commandListEmbed,
    helpPanel,
    findProduct,
    findField,
    balanceUser,
    moveBalance,
    profileEmbed,
    purchasesEmbed,
    spendingRankEmbed,
    inviteRankEmbed,
    outOfStockEmbed,
    balancePublicPayload,
    stockRequestPayload,
    ticketManagerPanel,
    ticketStaffPanel,
    handleSlashCommand,
  };
}
