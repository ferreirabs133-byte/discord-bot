import { REST, Routes, SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder().setName('syncemojis').setDescription('[Admin] Sincroniza emojis locais do clone Zend'),
  new SlashCommandBuilder().setName('panel').setDescription('[⚡⚙Admin] Use para abrir o painel de controle'),
  new SlashCommandBuilder().setName('add_ticket').setDescription('[⚡Admin] Adiciona um usuário ao ticket atual')
    .addUserOption((option) => option.setName('user').setDescription('Usuário que será adicionado ao ticket').setRequired(true)),
  new SlashCommandBuilder().setName('addsaldo').setDescription('[⚡Admin] Adiciona saldo a um usuário')
    .addUserOption((option) => option.setName('user').setDescription('Usuário que receberá saldo').setRequired(true))
    .addNumberOption((option) => option.setName('valor').setDescription('Valor em BRL').setRequired(true))
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo opcional')),
  new SlashCommandBuilder().setName('ajuda').setDescription('📋 Lista de comandos disponíveis no sistema'),
  new SlashCommandBuilder().setName('anunciar').setDescription('[⚡⚙Admin] Crie e envie anúncios personalizados para qualquer canal')
    .addChannelOption((option) => option.setName('canal').setDescription('Canal do anúncio').setRequired(true))
    .addStringOption((option) => option.setName('titulo').setDescription('Título do anúncio').setRequired(true))
    .addStringOption((option) => option.setName('mensagem').setDescription('Mensagem do anúncio').setRequired(true))
    .addStringOption((option) => option.setName('cor').setDescription('Cor hexadecimal opcional'))
    .addStringOption((option) => option.setName('imagem').setDescription('URL de imagem opcional')),
  new SlashCommandBuilder().setName('archive_ticket').setDescription('[⚡Admin] Use para arquivar um ticket'),
  new SlashCommandBuilder().setName('close_ticket').setDescription('[⚡Admin] Fecha o ticket de suporte atual')
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo opcional')),
  new SlashCommandBuilder().setName('closealltickets').setDescription('[⚡Admin] Fecha todos os tickets abertos'),
  new SlashCommandBuilder().setName('atualizar-condecoracoes').setDescription('[⚡Admin] Atualiza e recalcula as condecorações de um usuário')
    .addUserOption((option) => option.setName('user').setDescription('Usuário recalculado').setRequired(true)),
  new SlashCommandBuilder().setName('cargoall').setDescription('[⚡Admin] Define um cargo para todos os membros do servidor')
    .addRoleOption((option) => option.setName('cargo').setDescription('Cargo que seria aplicado').setRequired(true)),
  new SlashCommandBuilder().setName('clear').setDescription('[⚡Admin] Limpa mensagens do canal atual')
    .addIntegerOption((option) => option.setName('quantidade').setDescription('Quantidade de mensagens').setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName('conceder-condecoracao').setDescription('[⚡Admin] Concede uma condecoração a um usuário')
    .addUserOption((option) => option.setName('user').setDescription('Usuário').setRequired(true))
    .addStringOption((option) => option.setName('nome').setDescription('Nome da condecoração').setRequired(true)),
  new SlashCommandBuilder().setName('condecoracoes').setDescription('Exibe suas condecorações conquistadas através de compras')
    .addUserOption((option) => option.setName('user').setDescription('Usuário opcional')),
  new SlashCommandBuilder().setName('consultarpagamento').setDescription('[⚡⚙Admin] Consulta o status de um pagamento zenWallet pelo ID')
    .addStringOption((option) => option.setName('id').setDescription('ID do pagamento').setRequired(true)),
  new SlashCommandBuilder().setName('convites').setDescription('[👤User] Veja seus convites ou de outro usuário')
    .addUserOption((option) => option.setName('user').setDescription('Usuário opcional')),
  new SlashCommandBuilder().setName('invites_reset').setDescription('[⚡Admin] Reseta convites de um usuário ou de todos')
    .addUserOption((option) => option.setName('user').setDescription('Usuário opcional'))
    .addBooleanOption((option) => option.setName('todos').setDescription('Resetar todos os membros')),
  new SlashCommandBuilder().setName('create_mass_coupon').setDescription('[⚡Admin] Use para criar cupons para todos produtos')
    .addStringOption((option) => option.setName('codigo').setDescription('Código do cupom').setRequired(true))
    .addNumberOption((option) => option.setName('desconto').setDescription('Desconto em porcentagem').setRequired(true))
    .addStringOption((option) => option.setName('validade').setDescription('Validade opcional')),
  new SlashCommandBuilder().setName('cuponwin').setDescription('[⚡Admin] Envia um cupom de desconto para usuario')
    .addUserOption((option) => option.setName('user').setDescription('Usuário ganhador').setRequired(true))
    .addStringOption((option) => option.setName('codigo').setDescription('Código do cupom').setRequired(true))
    .addNumberOption((option) => option.setName('desconto').setDescription('Desconto em porcentagem').setRequired(true)),
  new SlashCommandBuilder().setName('delivery').setDescription('[⚡Admin] Entregar produto manualmente para um usuário')
    .addUserOption((option) => option.setName('user').setDescription('Usuário que receberá').setRequired(true))
    .addStringOption((option) => option.setName('produto').setDescription('Produto ou ID').setRequired(true))
    .addStringOption((option) => option.setName('conteudo').setDescription('Conteúdo entregue').setRequired(true)),
  new SlashCommandBuilder().setName('gerarpix').setDescription('[⚡Admin] Gera um QR Code PIX para pagamento avulso')
    .addNumberOption((option) => option.setName('valor').setDescription('Valor do PIX').setRequired(true))
    .addStringOption((option) => option.setName('descricao').setDescription('Descrição opcional')),
  new SlashCommandBuilder().setName('entregar').setDescription('[⚡Admin] Use para aprovar um carrinho')
    .addStringOption((option) => option.setName('id').setDescription('ID do carrinho ou pedido')),
  new SlashCommandBuilder().setName('enviarpv').setDescription('[⚡⚙Admin] Enviar mensagem privada para um membro do servidor')
    .addUserOption((option) => option.setName('user').setDescription('Membro').setRequired(true))
    .addStringOption((option) => option.setName('mensagem').setDescription('Mensagem privada').setRequired(true)),
  new SlashCommandBuilder().setName('lock').setDescription('[⚡Admin] Use para trancar o canal')
    .addChannelOption((option) => option.setName('canal').setDescription('Canal opcional'))
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo opcional')),
  new SlashCommandBuilder().setName('manage_item').setDescription('[⚡Admin] Use para gerenciar um campo de produto')
    .addStringOption((option) => option.setName('produto').setDescription('ID ou nome do produto'))
    .addStringOption((option) => option.setName('campo').setDescription('ID ou nome do campo')),
  new SlashCommandBuilder().setName('manage_product').setDescription('[⚡Admin] Use para gerenciar um produto')
    .addStringOption((option) => option.setName('produto').setDescription('ID ou nome do produto')),
  new SlashCommandBuilder().setName('manage_stock').setDescription('[⚡Admin] Use para gerenciar o estoque de um produto')
    .addStringOption((option) => option.setName('produto').setDescription('ID ou nome do produto'))
    .addStringOption((option) => option.setName('campo').setDescription('ID ou nome do campo')),
  new SlashCommandBuilder().setName('managetickets').setDescription('[⚡⚙Admin] Use para abrir o painel de gerenciamento de tickets'),
  new SlashCommandBuilder().setName('nuke').setDescription('[⚡Admin] Nuke a channel')
    .addChannelOption((option) => option.setName('canal').setDescription('Canal opcional'))
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo opcional')),
  new SlashCommandBuilder().setName('perfil').setDescription('[👤User] Use para ver o seu perfil de gastos')
    .addUserOption((option) => option.setName('user').setDescription('Usuário opcional')),
  new SlashCommandBuilder().setName('postproduto').setDescription('[⚡Admin] Posta a mensagem de um produto em um canal')
    .addChannelOption((option) => option.setName('canal').setDescription('Canal onde postar').setRequired(true))
    .addStringOption((option) => option.setName('produto').setDescription('ID ou nome do produto')),
  new SlashCommandBuilder().setName('produtossemestoque').setDescription('[⚡Admin] Lista todos os produtos sem estoque'),
  new SlashCommandBuilder().setName('rank').setDescription('[👤User] Mostra o ranking de clientes por valor gasto')
    .addIntegerOption((option) => option.setName('limite').setDescription('Quantidade de posições').setMinValue(1).setMaxValue(25)),
  new SlashCommandBuilder().setName('rank_convites').setDescription('[👤User] Exibe o ranking de convites')
    .addIntegerOption((option) => option.setName('limite').setDescription('Quantidade de posições').setMinValue(1).setMaxValue(25)),
  new SlashCommandBuilder().setName('remove_mass_coupon').setDescription('[⚡Admin] Use para remover cupons criados em massa')
    .addStringOption((option) => option.setName('codigo').setDescription('Código a remover').setRequired(true)),
  new SlashCommandBuilder().setName('remove-feedback').setDescription('[⚡Admin] Remove a permissão de um usuário de ver o Canal feed')
    .addUserOption((option) => option.setName('user').setDescription('Usuário').setRequired(true)),
  new SlashCommandBuilder().setName('removercargoall').setDescription('[⚡Admin] Remove um cargo de todos os membros do servidor')
    .addRoleOption((option) => option.setName('cargo').setDescription('Cargo que seria removido').setRequired(true)),
  new SlashCommandBuilder().setName('removersaldo').setDescription('[⚡Admin] Remove saldo de um usuário')
    .addUserOption((option) => option.setName('user').setDescription('Usuário').setRequired(true))
    .addNumberOption((option) => option.setName('valor').setDescription('Valor em BRL').setRequired(true))
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo opcional')),
  new SlashCommandBuilder().setName('saldopanel').setDescription('[⚡⚙Admin] Publica em canal público o painel de saldo')
    .addChannelOption((option) => option.setName('canal').setDescription('Canal onde postar o painel')),
  new SlashCommandBuilder().setName('sales').setDescription('[⚡Admin] Use para ver suas vendas')
    .addStringOption((option) => option.setName('periodo').setDescription('Período').addChoices(
      { name: 'Hoje', value: 'today' },
      { name: '7 dias', value: '7' },
      { name: '30 dias', value: '30' },
      { name: 'Total', value: 'all' },
    )),
  new SlashCommandBuilder().setName('sincronizar_posicoes').setDescription('[⚡Admin] Sincroniza os cargos de posição com base no valor gasto')
    .addUserOption((option) => option.setName('user').setDescription('Cliente opcional')),
  new SlashCommandBuilder().setName('sincronizar_permissoes').setDescription('[⚡Admin] Sincroniza permissões de canais com categorias'),
  new SlashCommandBuilder().setName('solicitarestoque').setDescription('[⚡⚙Admin] Envia o painel para usuários solicitarem produtos para estoque')
    .addChannelOption((option) => option.setName('canal').setDescription('Canal onde postar')),
  new SlashCommandBuilder().setName('ticketstaff').setDescription('[⚡Staff] Abre o painel staff do ticket atual (ephemeral)'),
  new SlashCommandBuilder().setName('tutorial').setDescription('[⚡⚙Admin] Reinicia o tutorial do painel de controle'),
  new SlashCommandBuilder().setName('vercompras').setDescription('[👤User] Veja o histórico completo das suas compras')
    .addUserOption((option) => option.setName('user').setDescription('Usuário opcional')),
  new SlashCommandBuilder().setName('vincular_assinatura').setDescription('[⚡Admin] Vincula uma assinatura a um usuário')
    .addUserOption((option) => option.setName('user').setDescription('Usuário').setRequired(true))
    .addStringOption((option) => option.setName('plano').setDescription('Plano/assinatura').setRequired(true))
    .addStringOption((option) => option.setName('validade').setDescription('Validade')),
  new SlashCommandBuilder().setName('vincular_clientes').setDescription('[⚡Admin] Use para sincronizar o cargo dos clientes'),
  new SlashCommandBuilder().setName('zenwallet').setDescription('[⚡⚙Admin] Abre o painel de configuração do zenWallet'),
].map((cmd) => cmd.toJSON());

export async function registerCommands({ token, clientId, guildId }) {
  const rest = new REST({ version: '10' }).setToken(token);

  // Discord soma comandos globais + do servidor. Se os dois existirem, aparece tudo duplicado.
  // Por isso: registra em UM escopo e limpa o outro.

  if (guildId) {
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      // Remove globais para não duplicar no servidor
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      console.log(`Slash commands registrados só no servidor ${guildId} (globais limpos).`);
      return;
    } catch (err) {
      const code = err?.code ?? err?.rawError?.code;
      console.warn(
        `Falha ao registrar comandos no guild ${guildId} (${code || err.message}). ` +
          'O bot precisa estar no servidor com o escopo applications.commands. ' +
          'Registrando comandos globais como fallback...',
      );
      // Se o guild falhou, limpa o que tiver no guild (quando possível) e usa global
      try {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
      } catch {
        /* ignore */
      }
    }
  }

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Slash commands globais registrados (sem duplicar no guild).');
  } catch (err) {
    console.error('Falha ao registrar slash commands:', err.message || err);
    console.error('Verifique token e clientId no config.json.');
    throw err;
  }
}
