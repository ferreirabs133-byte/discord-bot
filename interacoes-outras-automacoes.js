import { TextInputStyle } from 'discord.js';
import { id, modal, textInput } from '../discord/componentes.js';
import { EMOJI } from '../discord/emojis.js';
import { criarIdAutomacao } from './estado-automacoes.js';
import {
  painelAjudaLock,
  painelGerenciarLock,
  painelInviteTracker,
  painelLockUnlock,
  painelMencaoRestock,
  painelMonitorFeedbacks,
  painelRegraLock,
  painelRestock,
  painelSelecionarCanalAutomacao,
  painelSelecionarCanalLock,
  painelSelecionarCanalRestock,
} from './paineis-outras-automacoes.js';
import { notificarRestock } from './servico-automacoes.js';
import { atualizarPainelAutomacao, avisoAutomacao } from './painel-update.js';

function regraLock(gs, idRegra) {
  return gs.automations.lock.rules.find((item) => item.id === idRegra);
}

function horaValida(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

async function atualizarPainel(interaction, payload) {
  return atualizarPainelAutomacao(interaction, payload);
}

async function atualizarComAviso(interaction, painel, texto) {
  await atualizarPainel(interaction, painel);
  await avisoAutomacao(interaction, texto);
}

export async function tratarBotaoOutrasAutomacoes(interaction, gs, action, a, b) {
  const guild = interaction.guild;
  switch (action) {
    case 'auto-feedback-toggle':
      gs.automations.feedback.enabled = !gs.automations.feedback.enabled;
      await atualizarComAviso(interaction, painelMonitorFeedbacks(guild, gs), `Monitoramento de feedbacks ${gs.automations.feedback.enabled ? 'ativado' : 'desativado'} com sucesso!`);
      return true;
    case 'auto-feedback-emoji':
      await interaction.showModal(modal(id('modal-auto-feedback-emoji'), 'Definir Emoji', [
        textInput('emoji', 'Emoji/ID', 'Emoji padrão (🫡), ID ou emoji com markdown', TextInputStyle.Short, true, gs.automations.feedback.reactionEmoji || '🫡'),
      ]));
      return true;
    case 'auto-feedback-channel':
      await atualizarPainel(interaction, painelSelecionarCanalAutomacao(guild, {
        title: 'Selecionar Canal de Feedback',
        description: 'Escolha o canal onde os feedbacks serão monitorados.',
        customId: 'auto-feedback-channel-set',
        currentChannel: gs.automations.feedback.channel,
        backAction: 'auto-feedback',
      }));
      return true;

    case 'auto-lock-toggle':
      gs.automations.lock.enabled = !gs.automations.lock.enabled;
      await atualizarComAviso(interaction, painelLockUnlock(guild, gs), `Sistema de Lock-Unlock ${gs.automations.lock.enabled ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`);
      return true;
    case 'auto-lock-new':
      await atualizarPainel(interaction, painelSelecionarCanalLock(guild));
      return true;
    case 'auto-lock-manage':
      await atualizarPainel(interaction, painelGerenciarLock(guild, gs));
      return true;
    case 'auto-lock-help':
      await atualizarPainel(interaction, painelAjudaLock(guild));
      return true;
    case 'auto-lock-open': {
      const regra = regraLock(gs, a);
      if (regra) await atualizarPainel(interaction, painelRegraLock(guild, regra));
      return true;
    }
    case 'auto-lock-time': {
      const regra = regraLock(gs, a);
      if (!regra) return true;
      await interaction.showModal(modal(id('modal-auto-lock-time', a, b), b === 'lock' ? 'Configurar Lock' : 'Configurar Unlock', [
        textInput('time', `Horário para ${b === 'lock' ? 'trancar' : 'destrancar'} (HH:MM)`, b === 'lock' ? 'Ex: 22:00' : 'Ex: 08:00', TextInputStyle.Short, false, b === 'lock' ? regra.lockAt || '' : regra.unlockAt || ''),
      ]));
      return true;
    }
    case 'auto-lock-remove': {
      const index = gs.automations.lock.rules.findIndex((item) => item.id === a);
      if (index >= 0) gs.automations.lock.rules.splice(index, 1);
      await atualizarComAviso(interaction, painelGerenciarLock(guild, gs), 'Regra de Lock-Unlock removida com sucesso!');
      return true;
    }

    case 'auto-restock-toggle':
      gs.automations.restock.enabled = !gs.automations.restock.enabled;
      await atualizarComAviso(interaction, painelRestock(guild, gs), `Sistema de alerta de restock ${gs.automations.restock.enabled ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`);
      return true;
    case 'auto-restock-channel':
      await atualizarPainel(interaction, painelSelecionarCanalRestock(guild, gs));
      return true;
    case 'auto-restock-mention':
      await atualizarPainel(interaction, painelMencaoRestock(guild, gs));
      return true;
    case 'auto-restock-mention-none':
      gs.automations.restock.mention = 'none';
      gs.automations.restock.role = null;
      await atualizarPainel(interaction, painelMencaoRestock(guild, gs));
      return true;
    case 'auto-restock-mention-everyone':
      gs.automations.restock.mention = 'everyone';
      gs.automations.restock.role = null;
      await atualizarPainel(interaction, painelMencaoRestock(guild, gs));
      return true;
    case 'auto-restock-test': {
      const product = gs.products[0] || { name: 'Produto Exemplo' };
      const field = product.fields?.[0] || { name: 'Variação Teste', stock: [], ghostStock: { quantity: 150 } };
      const ok = await notificarRestock(guild, gs, product, field, 50);
      await interaction.reply({ content: ok ? `${EMOJI.yesgenesis} | Notificação de teste enviada com sucesso! Verifique o canal configurado.` : `${EMOJI.no} | Não foi possível enviar a notificação.`, ephemeral: true });
      return true;
    }
    case 'auto-restock-reset':
      gs.automations.restock.sentCount = 0;
      await atualizarComAviso(interaction, painelRestock(guild, gs), 'Contador de notificações resetado.');
      return true;

    case 'auto-invite-toggle':
      gs.automations.invite.enabled = !gs.automations.invite.enabled;
      await atualizarComAviso(interaction, painelInviteTracker(guild, gs), `Sistema de convites ${gs.automations.invite.enabled ? 'ativado' : 'desativado'} com sucesso!`);
      return true;
    case 'auto-invite-logs':
      await atualizarPainel(interaction, painelSelecionarCanalAutomacao(guild, {
        title: 'Selecionar Canal de Logs',
        description: 'Escolha o canal onde os logs de convites serão enviados.',
        customId: 'auto-invite-log-channel-set',
        currentChannel: gs.automations.invite.logChannel,
        backAction: 'auto-invite',
      }));
      return true;
    case 'auto-invite-top': {
      const ranking = Object.entries(gs.invitations || {}).sort(([, left], [, right]) => Number(right.count || 0) - Number(left.count || 0)).slice(0, 10);
      await interaction.reply({ content: ranking.length ? ranking.map(([userId, data], index) => `\`${index + 1}.\` <@${userId}> — \`${data.count || 0}\` convites`).join('\n') : 'Ainda não há dados de convites registrados.', ephemeral: true });
      return true;
    }
    case 'auto-invite-search':
      await interaction.showModal(modal(id('modal-auto-invite-search'), 'Buscar Usuário', [
        textInput('userId', 'ID do Usuário ou Menção', 'Ex: 123456789012345678 ou @usuario'),
      ]));
      return true;
    case 'auto-invite-rewards':
      await interaction.reply({ content: gs.automations.invite.rewards.length ? gs.automations.invite.rewards.map((reward) => `\`${reward.invites} convites\` → <@&${reward.roleId}>`).join('\n') : 'Nenhuma recompensa configurada ainda.', ephemeral: true });
      return true;
    case 'auto-invite-settings':
      await interaction.showModal(modal(id('modal-auto-invite-days'), 'Definir Dias Mínimos', [
        textInput('days', 'Dias Mínimos para Conta Válida', '7', TextInputStyle.Short, true, String(gs.automations.invite.minimumAccountDays || 7)),
      ]));
      return true;
    default:
      return false;
  }
}

export async function tratarMenuOutrasAutomacoes(interaction, gs, action) {
  if (action === 'auto-lock-select') {
    const regra = regraLock(gs, interaction.values[0]);
    if (regra) await atualizarPainel(interaction, painelRegraLock(interaction.guild, regra));
    return true;
  }
  if (action === 'auto-restock-role-set') {
    gs.automations.restock.mention = 'role';
    gs.automations.restock.role = interaction.values[0];
    await atualizarComAviso(interaction, painelMencaoRestock(interaction.guild, gs), `Cargo <@&${interaction.values[0]}> configurado para restock.`);
    return true;
  }
  return false;
}

export async function tratarCanalOutrasAutomacoes(interaction, gs, action) {
  const channelId = interaction.values[0];
  if (action === 'auto-lock-channel-new') {
    const existente = gs.automations.lock.rules.find((item) => item.channelId === channelId);
    const regra = existente || { id: criarIdAutomacao('lock'), channelId, lockAt: null, unlockAt: null, lastLockDate: null, lastUnlockDate: null };
    if (!existente) gs.automations.lock.rules.push(regra);
    await atualizarPainel(interaction, painelRegraLock(interaction.guild, regra));
    return true;
  }
  if (action === 'auto-restock-channel-set') {
    gs.automations.restock.channel = channelId;
    await atualizarComAviso(interaction, painelRestock(interaction.guild, gs), `Canal de restock definido: <#${channelId}>.`);
    return true;
  }
  if (action === 'auto-feedback-channel-set') {
    gs.automations.feedback.channel = channelId;
    await atualizarComAviso(interaction, painelMonitorFeedbacks(interaction.guild, gs), `Canal de feedback definido: <#${channelId}>.`);
    return true;
  }
  if (action === 'auto-invite-log-channel-set') {
    gs.automations.invite.logChannel = channelId;
    await atualizarComAviso(interaction, painelInviteTracker(interaction.guild, gs), `Canal de logs de convites definido: <#${channelId}>.`);
    return true;
  }
  return false;
}

export async function tratarModalOutrasAutomacoes(interaction, gs, action, a, b, get) {
  if (action === 'modal-auto-feedback-emoji') {
    gs.automations.feedback.reactionEmoji = get('emoji');
    await atualizarPainel(interaction, painelMonitorFeedbacks(interaction.guild, gs));
    return true;
  }
  if (action === 'modal-auto-lock-time') {
    const regra = regraLock(gs, a);
    const value = get('time');
    if (!regra) return true;
    if (value && !horaValida(value)) {
      await interaction.reply({ content: `${EMOJI.no} | Horário inválido. Use HH:MM.`, ephemeral: true });
      return true;
    }
    if (b === 'lock') regra.lockAt = value || null;
    else regra.unlockAt = value || null;
    await atualizarPainel(interaction, painelRegraLock(interaction.guild, regra));
    await interaction.followUp({ content: `${EMOJI.yesgenesis} | Horário atualizado com sucesso!`, ephemeral: true });
    return true;
  }
  if (action === 'modal-auto-invite-search') {
    const userId = get('userId').replace(/\D/g, '');
    const data = gs.invitations[userId];
    await interaction.reply({ content: data ? `<@${userId}>: \`${data.count || 0}\` convites, \`${data.fake || 0}\` fakes e \`${data.leaves || 0}\` saídas.` : 'Ainda não há dados de convites registrados para este usuário.', ephemeral: true });
    return true;
  }
  if (action === 'modal-auto-invite-days') {
    gs.automations.invite.minimumAccountDays = Math.max(0, Number(get('days')) || 7);
    await atualizarPainel(interaction, painelInviteTracker(interaction.guild, gs));
    return true;
  }
  return false;
}
