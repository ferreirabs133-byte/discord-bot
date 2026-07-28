import {
  ActionRowBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { button, embed, id } from '../discord/componentes.js';
import { EMOJI } from '../discord/emojis.js';

export function painelMonitorFeedbacks(guild, gs) {
  const config = gs.automations.feedback;
  return {
    embeds: [embed(
      'zenSallers\nSistema de monitoramento de feedbacks',
      [
        `**Sistema de monitoramento de feedbacks - ${config.enabled ? 'HABILITADO 🟢' : 'DESABILITADO 🔴'}**`,
        '',
        'O bot monitora as avaliações em tempo real. Feedbacks negativos são enviados aos administradores para análise, enquanto os positivos recebem uma reação automática.',
        '',
        `**Emoji de reação:**\n${config.reactionEmoji || '🫡'}`,
        `**Canal de feedback:**\n${config.channel ? `<#${config.channel}>` : '`🔴 Não definido`'}`,
      ].join('\n'),
      guild,
      'Automações',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-feedback-toggle'), config.enabled ? 'Desativar' : 'Ativar', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('auto-feedback-emoji'), 'Definir reaction emoji', ButtonStyle.Primary, EMOJI.edit),
        button(id('auto-feedback-channel'), 'Definir canal', ButtonStyle.Primary, EMOJI.textChannel),
      ),
      new ActionRowBuilder().addComponents(button(id('automations'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelLockUnlock(guild, gs) {
  const config = gs.automations.lock;
  const regras = config.rules || [];
  return {
    embeds: [embed(
      'zenSallers\n🔒 Sistema de Lock-Unlock Automático',
      [
        '◉ O sistema de Lock-Unlock permite configurar horários para trancar e destrancar canais automaticamente.',
        '',
        `**Status:** \`${config.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
        `**Regras Configuradas:** \`${regras.length}\``,
        '',
        '◷ Configure um agendamento de lock/unlock por canal.',
        ...(regras.length ? ['', '**▣ Regras Configuradas**', ...regras.map((regra) => `> <#${regra.channelId}>\n> 🔒 Lock: \`${regra.lockAt || 'não definido'}\` · 🔓 Unlock: \`${regra.unlockAt || 'não definido'}\``)] : []),
      ].join('\n'),
      guild,
      'Sistema de Lock-Unlock Automático',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-lock-toggle'), config.enabled ? 'Desabilitar Sistema' : 'Habilitar Sistema', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('auto-lock-new'), 'Nova Regra', ButtonStyle.Success, EMOJI.plus),
        button(id('auto-lock-manage'), 'Gerenciar Regras', ButtonStyle.Primary, EMOJI.edit, !regras.length),
      ),
      new ActionRowBuilder().addComponents(button(id('auto-lock-help'), 'Como Funciona', ButtonStyle.Secondary, EMOJI.warning)),
      new ActionRowBuilder().addComponents(button(id('automations'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelSelecionarCanalLock(guild) {
  return {
    embeds: [embed('zenSallers\n# Selecionar Canal', 'Selecione o canal onde deseja configurar o lock/unlock automático.\n\nApenas canais de texto podem ser selecionados.', guild, 'Automações').setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(id('auto-lock-channel-new')).setPlaceholder('Selecione um canal')),
      new ActionRowBuilder().addComponents(button(id('auto-lock'), 'Cancelar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelGerenciarLock(guild, gs) {
  const regras = gs.automations.lock.rules || [];
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('auto-lock-select'))
    .setPlaceholder('Selecione uma regra para gerenciar')
    .addOptions(regras.slice(0, 25).map((regra) => ({
      label: `#${guild.channels.cache.get(regra.channelId)?.name || regra.channelId}`.slice(0, 100),
      description: `Lock ${regra.lockAt || '--:--'} · Unlock ${regra.unlockAt || '--:--'}`,
      value: regra.id,
      emoji: '🔒',
    })));
  return {
    embeds: [embed('zenSallers\n🔒 Gerenciar Lock-Unlock', `Selecione uma regra abaixo.\n\n**Total:** \`${regras.length}\``, guild, 'Automações').setColor(0xe60000)],
    components: [
      ...(regras.length ? [new ActionRowBuilder().addComponents(select)] : []),
      new ActionRowBuilder().addComponents(button(id('auto-lock'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelRegraLock(guild, regra) {
  return {
    embeds: [embed(
      'zenSallers\n🔒 Configuração de Lock-Unlock',
      [
        `◉ Configuração de lock/unlock automático para <#${regra.channelId}>`,
        '',
        `**# Canal**\n<#${regra.channelId}>`,
        `**🔒 Horário do Lock**\n\`${regra.lockAt || 'Não definido'}\``,
        `**🔓 Horário do Unlock**\n\`${regra.unlockAt || 'Não definido'}\``,
      ].join('\n'),
      guild,
      `ID do Canal: ${regra.channelId}`,
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-lock-time', regra.id, 'lock'), 'Editar Horário Lock', ButtonStyle.Primary, '🔒'),
        button(id('auto-lock-time', regra.id, 'unlock'), 'Editar Horário Unlock', ButtonStyle.Success, '🔓'),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-lock-remove', regra.id), 'Remover Regra', ButtonStyle.Danger, EMOJI.trashcan),
        button(id('auto-lock-manage'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

export function painelAjudaLock(guild) {
  return {
    embeds: [embed(
      'zenSallers\n◉ Como Funciona o Lock-Unlock Automático',
      [
        ':genesisVerifieldDuo: **Configuração Básica**',
        '1. Crie uma regra selecionando um canal',
        '2. Configure horários de lock e unlock',
        '3. Ative o sistema para começar',
        '',
        ':genesisClock: **Funcionalidades**',
        '• Trancar canal automaticamente no horário definido',
        '• Destrancar automaticamente no horário definido',
        '• Destrancar manualmente pelo painel',
        '',
        ':lockEmoji: **Detalhes**',
        '• Horários no fuso de São Paulo (BRT)',
        '• O unlock pode acontecer no dia seguinte',
        '',
        ':unlockEmoji: Canais trancados podem ser destrancados manualmente ou automaticamente no horário configurado.',
      ].join('\n'),
      guild,
      'Sistema de Lock-Unlock Automático',
    ).setColor(0xe60000)],
    components: [new ActionRowBuilder().addComponents(button(id('auto-lock'), 'Voltar', ButtonStyle.Secondary, EMOJI.left))],
  };
}

export function painelRestock(guild, gs) {
  const config = gs.automations.restock;
  const mention = config.mention === 'everyone' ? '`@everyone`' : config.role ? `<@&${config.role}>` : '`Nenhuma`';
  return {
    embeds: [embed(
      'zenSallers\n🎁 Sistema de Alerta de Restock',
      [
        'Configure notificações automáticas sempre que o estoque de um produto for reposto.',
        '',
        '◉ **Quando o estoque de qualquer produto for adicionado, uma notificação será enviada no canal configurado!**',
        `**♟ Status**\n\`${config.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
        `**# Canal de Aviso**\n${config.channel ? `<#${config.channel}>` : '`Não configurado`'}`,
        `**🔔 Menção**\n${mention}`,
        `**📦 Notificações Enviadas**\n\`${config.sentCount || 0}x\``,
      ].join('\n'),
      guild,
      'Automações',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-restock-toggle'), config.enabled ? 'Desabilitar' : 'Habilitar', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('auto-restock-channel'), 'Selecionar canal de aviso', ButtonStyle.Primary, EMOJI.account),
        button(id('auto-restock-mention'), 'Configurar Menção', ButtonStyle.Primary, EMOJI.users),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-restock-test'), 'Testar Notificação', ButtonStyle.Secondary, EMOJI.refresh, !config.channel),
        button(id('auto-restock-reset'), 'Resetar Contador', ButtonStyle.Danger, EMOJI.trashcan),
      ),
      new ActionRowBuilder().addComponents(button(id('automations'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelSelecionarCanalRestock(guild, gs) {
  return {
    embeds: [embed('zenSallers\n# Selecionar Canal de Restock', `Selecione o canal onde as notificações de restock serão enviadas.\n\n**Canal atual:** ${gs.automations.restock.channel ? `<#${gs.automations.restock.channel}>` : '`Não configurado`'}`, guild, 'Automações').setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(id('auto-restock-channel-set')).setPlaceholder('📣 Selecione o canal de notificações')),
      new ActionRowBuilder().addComponents(button(id('auto-restock'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelSelecionarCanalAutomacao(guild, { title, description, customId, currentChannel, backAction }) {
  return {
    embeds: [embed(
      `zenSallers\n# ${title}`,
      `${description}\n\n**Canal atual:** ${currentChannel ? `<#${currentChannel}>` : '`Não configurado`'}`,
      guild,
      'Automações',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(id(customId)).setPlaceholder('Selecione um canal de texto')),
      new ActionRowBuilder().addComponents(button(id(backAction), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelMencaoRestock(guild, gs) {
  const config = gs.automations.restock;
  return {
    embeds: [embed(
      'zenSallers\n🔔 Configurar Menção de Restock',
      [
        'Escolha quem será mencionado quando uma notificação de restock for enviada.',
        '',
        `**▣ Menção atual:** ${config.mention === 'everyone' ? '`@everyone`' : config.role ? `<@&${config.role}>` : '`Nenhuma`'}`,
        '',
        '**◉ Opções:**',
        '• Nenhuma - Sem menção',
        '• @everyone - Menciona todos',
        '• Cargo - Selecione um cargo específico',
      ].join('\n'),
      guild,
      'Automações',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-restock-mention-none'), 'Nenhuma Menção', ButtonStyle.Success, EMOJI.no),
        button(id('auto-restock-mention-everyone'), '@everyone', ButtonStyle.Secondary, EMOJI.textChannel),
      ),
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(id('auto-restock-role-set')).setPlaceholder('Selecionar um cargo específico').setMinValues(1).setMaxValues(1),
      ),
      new ActionRowBuilder().addComponents(button(id('auto-restock'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelInviteTracker(guild, gs) {
  const config = gs.automations.invite;
  const registros = Object.values(gs.invitations || {});
  const total = registros.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const fakes = registros.reduce((sum, item) => sum + Number(item.fake || 0), 0);
  return {
    embeds: [embed(
      'zenSallers\n🎁 Sistema de Rastreamento de Convites',
      [
        'Configure e gerencie o sistema de convites do servidor.',
        '',
        `**Status:** \`${config.enabled ? '🟢 Habilitado' : '🔴 Desativado'}\``,
        `**Canal de Logs:** ${config.logChannel ? `<#${config.logChannel}>` : '`Não configurado`'}`,
        `**Recompensas:** \`${config.rewards.length} configurada(s)\``,
        '',
        '**▱ Estatísticas do Servidor:**',
        `├ Total de convites: \`${total}\``,
        `├ Contas fake: \`${fakes}\``,
        `└ Total de convidadores: \`${registros.length}\``,
      ].join('\n'),
      guild,
      'Automações',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-invite-toggle'), config.enabled ? 'Desativar Sistema' : 'Ativar Sistema', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.visible),
        button(id('auto-invite-rewards'), 'Recompensas', ButtonStyle.Primary, EMOJI.giveaway),
        button(id('auto-invite-top'), 'Top Convidadores', ButtonStyle.Primary, EMOJI.users),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-invite-search'), 'Buscar Usuário', ButtonStyle.Secondary, EMOJI.search),
        button(id('auto-invite-logs'), 'Config Logs', ButtonStyle.Secondary, EMOJI.notifyMember),
        button(id('auto-invite-settings'), 'Configurações', ButtonStyle.Secondary, EMOJI.settings),
      ),
      new ActionRowBuilder().addComponents(button(id('automations'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}
