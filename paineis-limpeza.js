import {
  ActionRowBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { button, embed, id } from '../discord/componentes.js';
import { EMOJI } from '../discord/emojis.js';

function horario(valor) {
  return valor || '`Não configurado`';
}

export function painelLimpezaAutomatica(guild, gs) {
  const config = gs.automations.cleanup;
  const regras = config.rules || [];
  const resumo = regras.length
    ? `\n\n**▣ Regras Configuradas**\n${regras.slice(0, 8).map((regra) => `> <#${regra.channelId}> · ${regra.schedules.filter((item) => item.time).map((item) => `\`${item.time}\``).join(' e ') || '`sem horário`'}`).join('\n')}`
    : '';

  return {
    embeds: [embed(
      'zenSallers\n🗑 Sistema de Limpeza Automática',
      [
        '◉ O sistema de limpeza automática permite configurar horários para limpar mensagens em canais específicos.',
        '',
        `**Status:** \`${config.enabled ? '🟢 Habilitado' : '🔴 Desabilitado'}\``,
        `**Regras Configuradas:** \`${regras.length}\``,
        '',
        '◷ Configure até **2 limpezas diárias por canal**, com opção de trancar e destrancar automaticamente.',
        resumo,
      ].join('\n'),
      guild,
      'Sistema de Limpeza Automática',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-toggle'), config.enabled ? 'Desabilitar Sistema' : 'Habilitar Sistema', config.enabled ? ButtonStyle.Danger : ButtonStyle.Success, EMOJI.refresh),
        button(id('auto-clean-new'), 'Nova Regra', ButtonStyle.Success, EMOJI.plus),
        button(id('auto-clean-manage'), 'Gerenciar Regras', ButtonStyle.Primary, EMOJI.edit, !regras.length),
      ),
      new ActionRowBuilder().addComponents(button(id('auto-clean-help'), 'Como Funciona', ButtonStyle.Secondary, EMOJI.warning)),
      new ActionRowBuilder().addComponents(button(id('automations'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelSelecionarCanalLimpeza(guild) {
  return {
    embeds: [embed(
      'zenSallers\n# Selecionar Canal',
      'Selecione o canal onde deseja configurar a limpeza automática.\n\nSomente canais de texto podem ser selecionados.',
      guild,
      'Automações',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(id('auto-clean-channel-new')).setPlaceholder('Selecione um canal')),
      new ActionRowBuilder().addComponents(button(id('auto-clean'), 'Cancelar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelGerenciarLimpezas(guild, gs) {
  const regras = gs.automations.cleanup.rules || [];
  const select = new StringSelectMenuBuilder()
    .setCustomId(id('auto-clean-select'))
    .setPlaceholder('Selecione uma regra para gerenciar')
    .addOptions(regras.slice(0, 25).map((regra) => ({
      label: `#${guild.channels.cache.get(regra.channelId)?.name || regra.channelId}`.slice(0, 100),
      description: regra.schedules.map((item) => item.time || 'não configurado').join(' · '),
      value: regra.id,
      emoji: '🗑️',
    })));

  return {
    embeds: [embed('zenSallers\n🗑 Gerenciar Regras de Limpeza', `Selecione uma regra abaixo.\n\n**Total:** \`${regras.length}\``, guild, 'Automações').setColor(0xe60000)],
    components: [
      ...(regras.length ? [new ActionRowBuilder().addComponents(select)] : []),
      new ActionRowBuilder().addComponents(button(id('auto-clean'), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelRegraLimpeza(guild, regra) {
  return {
    embeds: [embed(
      'zenSallers\n◷ Configuração de Limpeza',
      [
        `◉ Visão geral da regra de limpeza automática para <#${regra.channelId}>`,
        '',
        '**✓ Clique nos botões abaixo para configurar cada seção.**',
        `**# Canal**\n<#${regra.channelId}>`,
        `**▣ Preservar Fixadas**\n\`${regra.preservePinned ? '✓ Sim' : '✕ Não'}\``,
        `**♟ Ignorar Cargo**\n${regra.ignoreRoleId ? `<@&${regra.ignoreRoleId}>` : '`Nenhum`'}`,
        `**◷ 1ª Limpeza**\n${horario(regra.schedules[0]?.time)}`,
        `**◷ 2ª Limpeza**\n${horario(regra.schedules[1]?.time)}`,
      ].join('\n'),
      guild,
      `ID do Canal: ${regra.channelId}`,
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-schedule', regra.id, '0'), 'Configurar 1ª Limpeza', ButtonStyle.Primary, EMOJI.edit),
        button(id('auto-clean-schedule', regra.id, '1'), 'Configurar 2ª Limpeza', ButtonStyle.Primary, EMOJI.edit),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-advanced', regra.id), 'Configurações Avançadas', ButtonStyle.Secondary, EMOJI.warning),
        button(id('auto-clean-force', regra.id), 'Forçar Limpeza', ButtonStyle.Secondary, EMOJI.refresh),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-remove', regra.id), 'Remover Regra', ButtonStyle.Danger, EMOJI.trashcan),
        button(id('auto-clean-manage'), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

export function painelAgendamentoLimpeza(guild, regra, indice) {
  const agenda = regra.schedules[indice];
  const ordinal = Number(indice) + 1;
  return {
    embeds: [embed(
      `zenSallers\n◷ Configurar ${ordinal}ª Limpeza${ordinal === 2 ? ' (opcional)' : ''}`,
      [
        `Configure os horários e opções da ${ordinal === 1 ? 'primeira' : 'segunda'} limpeza diária para <#${regra.channelId}>.`,
        '',
        `**◷ Horário**\n${horario(agenda.time)}`,
        `**🔒 Trancar Canal**\n\`${agenda.lockAfter ? '✓ Sim, após a limpeza' : '✕ Não'}\``,
        `**🔓 Destrancar Automático**\n${horario(agenda.unlockAt)}`,
        agenda.time ? `**◷ Próxima Execução**\nDiariamente às \`${agenda.time}\`` : '',
      ].filter(Boolean).join('\n'),
      guild,
      `ID do Canal: ${regra.channelId}`,
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-time', regra.id, String(indice)), 'Editar Horário', ButtonStyle.Primary, EMOJI.edit),
        button(id('auto-clean-lock-toggle', regra.id, String(indice)), agenda.lockAfter ? 'Desativar Trancar' : 'Ativar Trancar', agenda.lockAfter ? ButtonStyle.Secondary : ButtonStyle.Primary, '🔒'),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-unlock', regra.id, String(indice)), 'Configurar Destranque', ButtonStyle.Secondary, EMOJI.edit, !agenda.lockAfter),
      ),
      new ActionRowBuilder().addComponents(button(id('auto-clean-open', regra.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left)),
    ],
  };
}

export function painelAvancadoLimpeza(guild, regra) {
  return {
    embeds: [embed(
      'zenSallers\n✓ Configurações Avançadas',
      [
        `Configure opções avançadas da limpeza automática para <#${regra.channelId}>.`,
        '',
        '**▣ Preservar Mensagens Fixadas**',
        regra.preservePinned ? '✓ Mensagens fixadas serão preservadas durante a limpeza.' : '✕ Mensagens fixadas também poderão ser removidas.',
        '',
        '**✓ Ignorar Cargo**',
        regra.ignoreRoleId ? `Mensagens de membros com <@&${regra.ignoreRoleId}> não serão deletadas.` : 'Nenhum cargo configurado. Todas as mensagens serão afetadas.',
      ].join('\n'),
      guild,
      'Configurações avançadas',
    ).setColor(0xe60000)],
    components: [
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-pinned', regra.id), regra.preservePinned ? 'Excluir Fixadas' : 'Preservar Fixadas', regra.preservePinned ? ButtonStyle.Success : ButtonStyle.Danger, EMOJI.visible),
      ),
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(id('auto-clean-ignore-role', regra.id)).setPlaceholder('Selecionar cargo ignorado').setMinValues(0).setMaxValues(1),
      ),
      new ActionRowBuilder().addComponents(
        button(id('auto-clean-ignore-remove', regra.id), 'Remover Cargo', ButtonStyle.Danger, EMOJI.trashcan, !regra.ignoreRoleId),
        button(id('auto-clean-open', regra.id), 'Voltar', ButtonStyle.Secondary, EMOJI.left),
      ),
    ],
  };
}

export function painelAjudaLimpeza(guild) {
  return {
    embeds: [embed(
      'zenSallers\n◉ Como Funciona a Limpeza Automática',
      [
        ':genesisVerifieldDuo: **Configuração Básica**',
        '1. Crie uma regra selecionando um canal',
        '2. Configure horários para 1ª e/ou 2ª limpeza diária',
        '3. Ative o sistema para começar',
        '',
        ':genesisClock: **Funcionalidades**',
        '• 2 limpezas diárias por canal',
        '• Trancar canal automaticamente após limpeza',
        '• Destrancar automaticamente em horário definido',
        '• Preservar mensagens fixadas',
        '• Ignorar cargo específico',
        '',
        ':lixeiraRed: **Detalhes da Limpeza**',
        '• Até 100 mensagens por operação',
        '• Mensagens com mais de 14 dias são preservadas pela API do Discord',
        '• Horários no fuso de São Paulo (BRT)',
        '',
        ':lockEmoji: Canais trancados podem ser destrancados manualmente ou automaticamente no horário configurado.',
      ].join('\n'),
      guild,
      'Sistema de Limpeza Automática',
    ).setColor(0xe60000)],
    components: [new ActionRowBuilder().addComponents(button(id('auto-clean'), 'Voltar', ButtonStyle.Secondary, EMOJI.left))],
  };
}
