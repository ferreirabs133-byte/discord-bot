process.env.ZEND_TEST_MODE = 'true';

const { paineisParaTeste } = await import('../src/aplicacao/iniciar-bot.js');
const mensagens = await import('../src/automacoes/paineis-mensagens.js');
const limpeza = await import('../src/automacoes/paineis-limpeza.js');
const outrasAutomacoes = await import('../src/automacoes/paineis-outras-automacoes.js');

const guild = { id: '1', name: 'Servidor de Teste', channels: { cache: new Map([['canal', { name: 'geral' }]]) } };
const user = { id: '2', username: 'cliente' };
const state = paineisParaTeste.criarEstado();
state.products.push({
  id: 'produto',
  name: 'Produto Teste',
  description: 'Descrição',
  autoDelivery: true,
  fields: [{ id: 'campo', name: 'Plano mensal', price: 19.9, stock: ['item'] }],
  coupons: [],
});
state.purchases.push({ product: 'Produto Teste', amount: 19.9, quantity: 1, status: 'DELIVERED' });
state.automations.messages.items.push({
  id: 'mensagem',
  channelId: 'canal',
  content: 'Mensagem de teste',
  intervalMinutes: 3,
  image: '',
  mode: 'embed',
  color: '#E60000',
  buttons: [{ label: 'Abrir', url: 'https://example.com', emoji: '🔗' }],
  lastSentAt: null,
  nextRunAt: Date.now() + 180_000,
});
state.automations.cleanup.rules.push({
  id: 'limpeza',
  channelId: 'canal',
  preservePinned: true,
  ignoreRoleId: null,
  schedules: [
    { time: '09:00', lockAfter: true, unlockAt: '10:00' },
    { time: null, lockAfter: false, unlockAt: null },
  ],
});
state.automations.lock.rules.push({ id: 'lock', channelId: 'canal', lockAt: '22:00', unlockAt: '08:00' });

const payloads = [
  ['principal', paineisParaTeste.principal(guild)],
  ['loja', paineisParaTeste.loja(guild, state, user)],
  ['tickets', paineisParaTeste.tickets(guild, state)],
  ['funções de ticket', paineisParaTeste.funcoesTicket(guild, state)],
  ['modo de ticket', paineisParaTeste.modoTicket(guild, state)],
  ['horários de ticket', paineisParaTeste.horariosTicket(guild, state)],
  ['boas-vindas', paineisParaTeste.boasVindas(guild, state)],
  ['personalização', paineisParaTeste.personalizacao(guild)],
  ['cores', paineisParaTeste.detalhePersonalizacao(guild, state, 'colors')],
  ['bot', paineisParaTeste.detalhePersonalizacao(guild, state, 'bot')],
  ['log pública', paineisParaTeste.detalhePersonalizacao(guild, state, 'public-log')],
  ['feedback', paineisParaTeste.detalhePersonalizacao(guild, state, 'feedback-dm')],
  ['produtos V2', paineisParaTeste.detalhePersonalizacao(guild, state, 'product-v2')],
  ['extrato', paineisParaTeste.extrato(guild, state, user)],
  ['gráfico', paineisParaTeste.graficoExtrato(guild, state)],
  ['sorteios', paineisParaTeste.sorteios(guild, state)],
  ['configurações', paineisParaTeste.configuracoes(guild)],
  ['canais', paineisParaTeste.canais(guild, state)],
  ['pagamentos', paineisParaTeste.pagamentos(guild, state)],
  ['zenCloud', paineisParaTeste.nuvem(guild, state)],
  ['zenProtect', paineisParaTeste.protecao(guild)],
  ['mensagens automáticas', mensagens.painelMensagensAutomaticas(guild, state)],
  ['gerenciar mensagens', mensagens.painelGerenciarMensagens(guild, state)],
  ['configurar mensagem', mensagens.painelConfigurarMensagem(guild, state.automations.messages.items[0])],
  ['botões de mensagem', mensagens.painelBotoesMensagem(guild, state.automations.messages.items[0])],
  ['payload de mensagem automática', mensagens.payloadMensagemAutomatica(state.automations.messages.items[0])],
  ['limpeza automática', limpeza.painelLimpezaAutomatica(guild, state)],
  ['regra de limpeza', limpeza.painelRegraLimpeza(guild, state.automations.cleanup.rules[0])],
  ['agendamento de limpeza', limpeza.painelAgendamentoLimpeza(guild, state.automations.cleanup.rules[0], 0)],
  ['limpeza avançada', limpeza.painelAvancadoLimpeza(guild, state.automations.cleanup.rules[0])],
  ['feedbacks', outrasAutomacoes.painelMonitorFeedbacks(guild, state)],
  ['lock-unlock', outrasAutomacoes.painelLockUnlock(guild, state)],
  ['regra de lock', outrasAutomacoes.painelRegraLock(guild, state.automations.lock.rules[0])],
  ['restock', outrasAutomacoes.painelRestock(guild, state)],
  ['invite tracker', outrasAutomacoes.painelInviteTracker(guild, state)],
];

for (const [name, payload] of payloads) {
  for (const embed of payload.embeds || []) embed.toJSON();
  for (const row of payload.components || []) row.toJSON();
  for (const file of payload.files || []) await file.attachment?.arrayBuffer?.();
  console.log(`OK ${name}`);
}
