export function criarEstadoPadraoAutomacoes() {
  return {
    repost: { enabled: true, nuke: false, time: '09:00' },
    messages: { enabled: false, items: [] },
    cleanup: { enabled: false, rules: [] },
    feedback: { enabled: false, channel: null, reactionEmoji: '🫡' },
    lock: { enabled: false, rules: [] },
    invite: {
      enabled: false,
      logChannel: null,
      rewards: [],
      countFake: false,
      minimumAccountDays: 7,
    },
    restock: {
      enabled: false,
      channel: null,
      mention: 'none',
      role: null,
      sentCount: 0,
    },
  };
}

export function normalizarEstadoAutomacoes(gs) {
  const automacoes = gs.automations;

  if (!Array.isArray(automacoes.messages.items)) {
    automacoes.messages.items = [];
    if (automacoes.messages.channel && automacoes.messages.content) {
      automacoes.messages.items.push({
        id: `msg_${Date.now().toString(36)}`,
        channelId: automacoes.messages.channel,
        content: automacoes.messages.content,
        intervalMinutes: Number(automacoes.messages.interval) || 60,
        image: '',
        mode: 'message',
        color: '#E60000',
        buttons: [],
        lastSentAt: null,
        nextRunAt: Date.now() + (Number(automacoes.messages.interval) || 60) * 60_000,
      });
    }
  }

  if (!Array.isArray(automacoes.cleanup.rules)) automacoes.cleanup.rules = [];
  if (!Array.isArray(automacoes.lock.rules)) automacoes.lock.rules = [];
  if (!Array.isArray(automacoes.invite.rewards)) automacoes.invite.rewards = [];
  if (!Array.isArray(automacoes.feedback?.channels)) automacoes.feedback.channels = [];

  // Garante estrutura válida de cada regra de limpeza (evita botões mortos)
  for (const regra of automacoes.cleanup.rules) {
    if (!regra.id) regra.id = `clean_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    if (!Array.isArray(regra.schedules)) regra.schedules = [];
    while (regra.schedules.length < 2) {
      regra.schedules.push({
        time: null,
        lockAfter: false,
        unlockAt: null,
        lastRunDate: null,
        lastUnlockDate: null,
      });
    }
    for (const agenda of regra.schedules) {
      if (typeof agenda.lockAfter !== 'boolean') agenda.lockAfter = Boolean(agenda.lockAfter);
      if (agenda.time === '') agenda.time = null;
      if (agenda.unlockAt === '') agenda.unlockAt = null;
    }
    if (regra.preservePinned === undefined) regra.preservePinned = true;
    if (regra.ignoreRoleId === undefined) regra.ignoreRoleId = null;
  }

  for (const regra of automacoes.lock.rules) {
    if (!regra.id) regra.id = `lock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  return automacoes;
}

export function criarIdAutomacao(prefixo) {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
