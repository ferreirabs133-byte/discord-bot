import { ActionRowBuilder, ButtonStyle, TextInputStyle } from 'discord.js';
import { button, id, modal, textInput } from '../discord/componentes.js';
import { EMOJI } from '../discord/emojis.js';
import { userDraft } from '../database/estado.js';
import { criarIdAutomacao } from './estado-automacoes.js';
import {
  painelBotoesMensagem,
  painelConfigurarMensagem,
  painelGerenciarMensagens,
  painelMensagensAutomaticas,
  painelSelecionarCanalMensagem,
  painelVisualizarTodasMensagens,
} from './paineis-mensagens.js';
import {
  painelAgendamentoLimpeza,
  painelAjudaLimpeza,
  painelAvancadoLimpeza,
  painelGerenciarLimpezas,
  painelLimpezaAutomatica,
  painelRegraLimpeza,
  painelSelecionarCanalLimpeza,
} from './paineis-limpeza.js';
import { enviarMensagemAutomatica, executarLimpeza } from './servico-automacoes.js';
import { atualizarPainelAutomacao, avisoAutomacao } from './painel-update.js';
import { normalizarEstadoAutomacoes } from './estado-automacoes.js';

function mensagemPorId(gs, messageId) {
  return gs.automations.messages.items.find((item) => item.id === messageId);
}

function garantirRegra(gs, ruleId) {
  normalizarEstadoAutomacoes(gs);
  return gs.automations.cleanup.rules.find((item) => item.id === ruleId) || null;
}

function agendaPadrao() {
  return { time: null, lockAfter: false, unlockAt: null, lastRunDate: null, lastUnlockDate: null };
}

async function atualizarPainel(interaction, payload) {
  return atualizarPainelAutomacao(interaction, payload);
}

async function atualizarComAviso(interaction, payload, aviso) {
  await atualizarPainel(interaction, payload);
  await avisoAutomacao(interaction, aviso);
}

async function erroPainel(interaction, texto) {
  const msg = `${EMOJI.no} | ${texto}`;
  try {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: msg, ephemeral: true });
    } else {
      await interaction.followUp({ content: msg, ephemeral: true });
    }
  } catch {
    /* ignore */
  }
}

function horarioValido(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function tratarBotaoAutomacoes(interaction, gs, action, a, b) {
  const guild = interaction.guild;

  switch (action) {
    case 'auto-msg-toggle':
      gs.automations.messages.enabled = !gs.automations.messages.enabled;
      await atualizarComAviso(interaction, painelMensagensAutomaticas(guild, gs), `Sistema de mensagens automáticas ${gs.automations.messages.enabled ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`);
      return true;
    case 'auto-msg-new':
      await interaction.showModal(modal(id('modal-auto-msg-new'), 'Nova Mensagem Automática', [
        textInput('content', 'Conteúdo da mensagem', 'Digite a mensagem que será enviada automaticamente', TextInputStyle.Paragraph),
        textInput('interval', 'Intervalo em minutos (ex: 30, 60, 120)', '60'),
        textInput('image', 'Link de imagem/gif (opcional)', 'https://exemplo.com/imagem.png', TextInputStyle.Short, false),
      ]));
      return true;
    case 'auto-msg-manage':
      await atualizarPainel(interaction, painelGerenciarMensagens(guild, gs));
      return true;
    case 'auto-msg-view-all':
      await atualizarPainel(interaction, painelVisualizarTodasMensagens(guild, gs));
      return true;
    case 'auto-msg-refresh':
      await atualizarPainel(interaction, painelMensagensAutomaticas(guild, gs));
      return true;
    case 'auto-msg-open': {
      const item = mensagemPorId(gs, a);
      if (item) await atualizarPainel(interaction, painelConfigurarMensagem(guild, item));
      return true;
    }
    case 'auto-msg-edit': {
      const item = mensagemPorId(gs, a);
      if (!item) return true;
      await interaction.showModal(modal(id('modal-auto-msg-edit', a), 'Editar Mensagem', [
        textInput('content', 'Novo conteúdo da mensagem', 'Digite o novo conteúdo', TextInputStyle.Paragraph, true, item.content),
        textInput('image', 'Link de imagem/gif (opcional)', 'https://exemplo.com/imagem.png', TextInputStyle.Short, false, item.image || ''),
      ]));
      return true;
    }
    case 'auto-msg-interval': {
      const item = mensagemPorId(gs, a);
      if (!item) return true;
      await interaction.showModal(modal(id('modal-auto-msg-interval', a), 'Alterar Intervalo', [
        textInput('interval', 'Novo intervalo em minutos', 'Ex: 30', TextInputStyle.Short, true, String(item.intervalMinutes)),
      ]));
      return true;
    }
    case 'auto-msg-mode': {
      const item = mensagemPorId(gs, a);
      if (!item) return true;
      item.mode = item.mode === 'embed' ? 'message' : 'embed';
      await atualizarComAviso(interaction, painelConfigurarMensagem(guild, item), `Tipo alterado para ${item.mode === 'embed' ? 'Embed' : 'Mensagem'}.`);
      return true;
    }
    case 'auto-msg-color': {
      const item = mensagemPorId(gs, a);
      if (!item) return true;
      await interaction.showModal(modal(id('modal-auto-msg-color', a), 'Alterar Cor da Embed', [
        textInput('color', 'Cor hexadecimal', 'Ex: #E60000', TextInputStyle.Short, true, item.color || '#E60000'),
      ]));
      return true;
    }
    case 'auto-msg-send': {
      const item = mensagemPorId(gs, a);
      if (!item) return true;
      await interaction.deferReply({ ephemeral: true });
      const result = await enviarMensagemAutomatica(guild, item);
      await interaction.editReply(result.ok ? `${EMOJI.yesgenesis} | Mensagem enviada com sucesso!` : `${EMOJI.no} | ${result.error}`);
      return true;
    }
    case 'auto-msg-change-channel':
      userDraft(interaction.user.id).automationMessageId = a;
      await atualizarPainel(interaction, painelSelecionarCanalMensagem(guild, mensagemPorId(gs, a)));
      return true;
    case 'auto-msg-channel-id':
      await interaction.showModal(modal(id('modal-auto-msg-channel-id'), 'Definir Canal por ID', [
        textInput('channelId', 'ID do Canal', 'Insira o ID do canal'),
      ]));
      return true;
    case 'auto-msg-remove': {
      const index = gs.automations.messages.items.findIndex((item) => item.id === a);
      if (index >= 0) gs.automations.messages.items.splice(index, 1);
      await atualizarComAviso(interaction, painelGerenciarMensagens(guild, gs), 'Mensagem automática removida com sucesso!');
      return true;
    }
    case 'auto-msg-buttons': {
      const item = mensagemPorId(gs, a);
      if (item) await atualizarPainel(interaction, painelBotoesMensagem(guild, item));
      return true;
    }
    case 'auto-msg-button-add':
      await interaction.showModal(modal(id('modal-auto-msg-button-add', a), 'Adicionar Botão URL', [
        textInput('label', 'Texto do botão', 'Ex: Acessar Site'),
        textInput('url', 'URL do botão', 'https://exemplo.com'),
        textInput('emoji', 'Emoji (ID, markdown ou unicode)', '🎉', TextInputStyle.Short, false),
      ]));
      return true;
    case 'auto-msg-button-clear': {
      const item = mensagemPorId(gs, a);
      if (item) item.buttons = [];
      await atualizarComAviso(interaction, painelBotoesMensagem(guild, item), 'Botões removidos com sucesso!');
      return true;
    }

    case 'auto-clean-toggle':
      gs.automations.cleanup.enabled = !gs.automations.cleanup.enabled;
      await atualizarComAviso(
        interaction,
        painelLimpezaAutomatica(guild, gs),
        `Sistema de limpeza automática ${gs.automations.cleanup.enabled ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`,
      );
      return true;
    case 'auto-clean-new':
      await atualizarPainel(interaction, painelSelecionarCanalLimpeza(guild));
      return true;
    case 'auto-clean-manage':
      normalizarEstadoAutomacoes(gs);
      await atualizarPainel(interaction, painelGerenciarLimpezas(guild, gs));
      return true;
    case 'auto-clean-help':
      await atualizarPainel(interaction, painelAjudaLimpeza(guild));
      return true;
    case 'auto-clean-open': {
      const regra = garantirRegra(gs, a);
      if (!regra) {
        await erroPainel(interaction, 'Regra de limpeza não encontrada. Abra Gerenciar Regras de novo.');
        return true;
      }
      await atualizarPainel(interaction, painelRegraLimpeza(guild, regra));
      return true;
    }
    case 'auto-clean-schedule': {
      const regra = garantirRegra(gs, a);
      const idx = Number(b);
      if (!regra || !Number.isFinite(idx) || !regra.schedules[idx]) {
        await erroPainel(interaction, 'Agendamento não encontrado.');
        return true;
      }
      await atualizarPainel(interaction, painelAgendamentoLimpeza(guild, regra, idx));
      return true;
    }
    case 'auto-clean-time': {
      const regra = garantirRegra(gs, a);
      const idx = Number(b);
      if (!regra?.schedules?.[idx]) {
        await erroPainel(interaction, 'Agendamento não encontrado.');
        return true;
      }
      await interaction.showModal(
        modal(id('modal-auto-clean-time', a, String(idx)), `Configurar ${idx + 1}ª Limpeza`, [
          textInput(
            'time',
            'Horário (HH:MM) - Vazio para desativar',
            '09:00',
            TextInputStyle.Short,
            false,
            regra.schedules[idx].time || '',
          ),
        ]),
      );
      return true;
    }
    case 'auto-clean-lock-toggle': {
      const regra = garantirRegra(gs, a);
      const idx = Number(b);
      const agenda = regra?.schedules?.[idx];
      if (!agenda) {
        await erroPainel(interaction, 'Agendamento não encontrado.');
        return true;
      }
      agenda.lockAfter = !agenda.lockAfter;
      if (!agenda.lockAfter) agenda.unlockAt = null;
      await atualizarPainel(interaction, painelAgendamentoLimpeza(guild, regra, idx));
      return true;
    }
    case 'auto-clean-unlock': {
      const regra = garantirRegra(gs, a);
      const idx = Number(b);
      if (!regra?.schedules?.[idx]) {
        await erroPainel(interaction, 'Agendamento não encontrado.');
        return true;
      }
      if (!regra.schedules[idx].lockAfter) {
        await erroPainel(interaction, 'Ative **Trancar Canal** antes de configurar o destranque.');
        return true;
      }
      await interaction.showModal(
        modal(id('modal-auto-clean-unlock', a, String(idx)), `Destrancar · ${idx + 1}ª Limpeza`, [
          textInput(
            'time',
            'Horário para destrancar (HH:MM)',
            '08:00',
            TextInputStyle.Short,
            false,
            regra.schedules[idx].unlockAt || '',
          ),
        ]),
      );
      return true;
    }
    case 'auto-clean-advanced': {
      const regra = garantirRegra(gs, a);
      if (!regra) {
        await erroPainel(interaction, 'Regra de limpeza não encontrada.');
        return true;
      }
      await atualizarPainel(interaction, painelAvancadoLimpeza(guild, regra));
      return true;
    }
    case 'auto-clean-pinned': {
      const regra = garantirRegra(gs, a);
      if (!regra) {
        await erroPainel(interaction, 'Regra de limpeza não encontrada.');
        return true;
      }
      regra.preservePinned = !regra.preservePinned;
      await atualizarComAviso(
        interaction,
        painelAvancadoLimpeza(guild, regra),
        regra.preservePinned
          ? 'Mensagens fixadas serão preservadas.'
          : 'Mensagens fixadas poderão ser removidas.',
      );
      return true;
    }
    case 'auto-clean-ignore-remove': {
      const regra = garantirRegra(gs, a);
      if (!regra) {
        await erroPainel(interaction, 'Regra de limpeza não encontrada.');
        return true;
      }
      regra.ignoreRoleId = null;
      await atualizarComAviso(interaction, painelAvancadoLimpeza(guild, regra), 'Cargo ignorado removido.');
      return true;
    }
    case 'auto-clean-force': {
      const regra = garantirRegra(gs, a);
      if (!regra) {
        await erroPainel(interaction, 'Regra de limpeza não encontrada.');
        return true;
      }
      await interaction.deferReply({ ephemeral: true });
      const result = await executarLimpeza(guild, regra);
      await interaction.editReply(
        result.ok
          ? `${EMOJI.yesgenesis} | Limpeza forçada! ${result.removidas} mensagens removidas de <#${regra.channelId}>.`
          : `${EMOJI.no} | ${result.error}`,
      );
      return true;
    }
    case 'auto-clean-remove': {
      const index = gs.automations.cleanup.rules.findIndex((item) => item.id === a);
      if (index >= 0) gs.automations.cleanup.rules.splice(index, 1);
      await atualizarComAviso(
        interaction,
        painelGerenciarLimpezas(guild, gs),
        'Regra de limpeza removida com sucesso!',
      );
      return true;
    }
    default:
      return false;
  }
}

export async function tratarMenuAutomacoes(interaction, gs, action, a) {
  if (action === 'auto-msg-select') {
    const item = mensagemPorId(gs, interaction.values[0]);
    if (!item) {
      await erroPainel(interaction, 'Mensagem não encontrada.');
      return true;
    }
    await atualizarPainel(interaction, painelConfigurarMensagem(interaction.guild, item));
    return true;
  }
  if (action === 'auto-clean-select') {
    const regra = garantirRegra(gs, interaction.values[0]);
    if (!regra) {
      await erroPainel(interaction, 'Regra de limpeza não encontrada.');
      return true;
    }
    await atualizarPainel(interaction, painelRegraLimpeza(interaction.guild, regra));
    return true;
  }
  if (action === 'auto-clean-ignore-role') {
    const regra = garantirRegra(gs, a);
    if (!regra) {
      await erroPainel(interaction, 'Regra de limpeza não encontrada.');
      return true;
    }
    // RoleSelect pode vir vazio (min 0) = limpar
    regra.ignoreRoleId = interaction.values?.[0] || null;
    await atualizarComAviso(
      interaction,
      painelAvancadoLimpeza(interaction.guild, regra),
      regra.ignoreRoleId
        ? `Mensagens de <@&${regra.ignoreRoleId}> serão preservadas na limpeza.`
        : 'Cargo ignorado removido.',
    );
    return true;
  }
  return false;
}

export async function tratarCanalAutomacoes(interaction, gs, action, a) {
  const channelId = interaction.values[0];
  if (action === 'auto-msg-channel-new') {
    const draft = userDraft(interaction.user.id).automationMessage;
    const existingId = userDraft(interaction.user.id).automationMessageId;
    if (existingId) {
      const item = mensagemPorId(gs, existingId);
      if (item) item.channelId = channelId;
      delete userDraft(interaction.user.id).automationMessageId;
      await atualizarComAviso(interaction, painelConfigurarMensagem(interaction.guild, item), `Canal alterado para <#${channelId}>.`);
      return true;
    }
    if (!draft) return true;
    const item = { ...draft, id: criarIdAutomacao('msg'), channelId, lastSentAt: null, nextRunAt: Date.now() + draft.intervalMinutes * 60_000, buttons: [] };
    gs.automations.messages.items.push(item);
    delete userDraft(interaction.user.id).automationMessage;
    await atualizarComAviso(interaction, painelMensagensAutomaticas(interaction.guild, gs), `Mensagem automática adicionada com sucesso!\nCanal: <#${channelId}> · Intervalo: \`${item.intervalMinutes} minutos\``);
    return true;
  }
  if (action === 'auto-clean-channel-new') {
    normalizarEstadoAutomacoes(gs);
    const existente = gs.automations.cleanup.rules.find((item) => item.channelId === channelId);
    const regra = existente || {
      id: criarIdAutomacao('clean'),
      channelId,
      preservePinned: true,
      ignoreRoleId: null,
      schedules: [agendaPadrao(), agendaPadrao()],
    };
    if (!existente) gs.automations.cleanup.rules.push(regra);
    normalizarEstadoAutomacoes(gs);
    await atualizarPainel(interaction, painelRegraLimpeza(interaction.guild, regra));
    return true;
  }
  return false;
}

export async function tratarModalAutomacoes(interaction, gs, action, a, b, get) {
  const guild = interaction.guild;
  if (action === 'modal-auto-msg-new') {
    const intervalMinutes = Math.max(1, Number(get('interval')) || 60);
    userDraft(interaction.user.id).automationMessage = {
      content: get('content'),
      intervalMinutes,
      image: get('image'),
      mode: 'message',
      color: '#E60000',
    };
    await atualizarPainel(interaction, painelSelecionarCanalMensagem(guild, userDraft(interaction.user.id).automationMessage));
    return true;
  }
  if (action === 'modal-auto-msg-channel-id') {
    const channelId = get('channelId').replace(/\D/g, '');
    const draft = userDraft(interaction.user.id).automationMessage;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!draft || !channel?.isTextBased()) {
      await interaction.reply({ content: `${EMOJI.no} | ID de canal inválido.`, ephemeral: true });
      return true;
    }
    const item = { ...draft, id: criarIdAutomacao('msg'), channelId, lastSentAt: null, nextRunAt: Date.now() + draft.intervalMinutes * 60_000, buttons: [] };
    gs.automations.messages.items.push(item);
    delete userDraft(interaction.user.id).automationMessage;
    await atualizarPainel(interaction, painelMensagensAutomaticas(guild, gs));
    await interaction.followUp({ content: `${EMOJI.yesgenesis} | Mensagem automática adicionada com sucesso!`, ephemeral: true });
    return true;
  }
  if (action === 'modal-auto-msg-edit') {
    const item = mensagemPorId(gs, a);
    if (!item) return true;
    item.content = get('content');
    item.image = get('image');
    await atualizarPainel(interaction, painelConfigurarMensagem(guild, item));
    await interaction.followUp({ content: `${EMOJI.yesgenesis} | Conteúdo atualizado com sucesso!`, ephemeral: true });
    return true;
  }
  if (action === 'modal-auto-msg-interval') {
    const item = mensagemPorId(gs, a);
    if (!item) return true;
    item.intervalMinutes = Math.max(1, Number(get('interval')) || item.intervalMinutes);
    item.nextRunAt = Date.now() + item.intervalMinutes * 60_000;
    await atualizarPainel(interaction, painelConfigurarMensagem(guild, item));
    await interaction.followUp({ content: `${EMOJI.yesgenesis} | Intervalo alterado para \`${item.intervalMinutes} minutos\`.`, ephemeral: true });
    return true;
  }
  if (action === 'modal-auto-msg-color') {
    const item = mensagemPorId(gs, a);
    const value = get('color');
    if (item && /^#?[0-9a-f]{6}$/i.test(value)) item.color = value.startsWith('#') ? value : `#${value}`;
    await atualizarPainel(interaction, painelConfigurarMensagem(guild, item));
    return true;
  }
  if (action === 'modal-auto-msg-button-add') {
    const item = mensagemPorId(gs, a);
    if (!item) return true;
    try {
      new URL(get('url'));
    } catch {
      await interaction.reply({ content: `${EMOJI.no} | URL inválida.`, ephemeral: true });
      return true;
    }
    item.buttons ||= [];
    if (item.buttons.length < 5) item.buttons.push({ label: get('label').slice(0, 80), url: get('url'), emoji: get('emoji') });
    await atualizarPainel(interaction, painelBotoesMensagem(guild, item));
    return true;
  }
  if (action === 'modal-auto-clean-time') {
    const regra = garantirRegra(gs, a);
    const idx = Number(b);
    const value = get('time');
    if (!regra?.schedules?.[idx]) {
      await erroPainel(interaction, 'Agendamento não encontrado.');
      return true;
    }
    if (value && !horarioValido(value)) {
      await erroPainel(interaction, 'Horário inválido. Use HH:MM, por exemplo 09:00.');
      return true;
    }
    regra.schedules[idx].time = value || null;
    await atualizarPainel(interaction, painelAgendamentoLimpeza(guild, regra, idx));
    await avisoAutomacao(
      interaction,
      `${idx + 1}ª limpeza ${value ? `configurada para \`${value}\`` : 'desativada'}!`,
    );
    return true;
  }
  if (action === 'modal-auto-clean-unlock') {
    const regra = garantirRegra(gs, a);
    const idx = Number(b);
    const value = get('time');
    if (!regra?.schedules?.[idx]) {
      await erroPainel(interaction, 'Agendamento não encontrado.');
      return true;
    }
    if (value && !horarioValido(value)) {
      await erroPainel(interaction, 'Horário inválido. Use HH:MM.');
      return true;
    }
    regra.schedules[idx].unlockAt = value || null;
    await atualizarPainel(interaction, painelAgendamentoLimpeza(guild, regra, idx));
    await avisoAutomacao(
      interaction,
      value
        ? `Destranque automático às \`${value}\`.`
        : 'Destranque automático desativado.',
    );
    return true;
  }
  return false;
}
