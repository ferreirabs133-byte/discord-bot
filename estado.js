import fs from 'node:fs/promises';
import path from 'node:path';
import { POSITION_LIMIT, applySyncedEmojiOverrides } from '../discord/emojis.js';
import { criarEstadoPadraoAutomacoes, normalizarEstadoAutomacoes } from '../automacoes/estado-automacoes.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

export async function loadState() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    return JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
  } catch {
    return { guilds: {}, drafts: {} };
  }
}

export let state = await loadState();

export async function saveState() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export function defaultGuildState() {
  return {
    currency: 'BRL',
    locale: 'pt_BR',
    products: [],
    channels: {
      orderLogs: null,
      publicPurchases: null,
      welcome: null,
      system: null,
      entries: null,
      exits: null,
      messages: null,
      voiceTraffic: null,
      feedback: null,
      tickets: null,
      notify: null,
      stockRequests: null,
    },
    roles: {
      client: null,
      staff: null,
      manager: null,
      notify: null,
    },
    payments: {
      manual: {
        enabled: false,
        configured: true,
        pixKey: 'suachavepix@gmail.com',
        keyType: 'Não definido',
        message: 'Após o pagamento envie o comprovante',
      },
      efi: { enabled: false, configured: false, clientId: '', clientSecret: '', pixKey: '', certificate: '' },
      mercadoPago: { enabled: false, configured: false, accessToken: '', publicKey: '' },
      zenWallet: { enabled: false, configured: true },
      nubank: { enabled: false, configured: false },
      pushinpay: { enabled: false, configured: false },
      litecoin: { enabled: false, configured: false },
    },
    welcome: {
      enabled: true,
      embed: false,
      autoDeleteSeconds: 5,
      message: 'Olá {member} gaste todo seu dinheiro na loja!',
      image: '',
      color: '#2b2d31',
      title: 'Bem-vindo(a)!',
    },
    ticket: {
      configured: true,
      openMode: 'Thread Privada',
      messageMode: 'Embed Clássico',
      title: 'Central de Atendimento | Zend Sallers',
      description:
        'Após solicitar um atendimento, aguarde um integrante da equipe responde-lo(a). O atendimento é realizado de forma privada, contudo, somente integrantes da equipe terá acesso ao atendimento. Tenha ciência que a nossa equipe não se encontra presente 24 horas por dia, contudo, dentro dos horários citados acima nossa equipe se encontra disponibilizada a atende-lo(a).',
      banner:
        'https://media.discordapp.net/attachments/1358115100032106506/1366529704219246673/ZenSallers.png',
      color: '#FFFFFF',
      functions: [{ id: 'support', name: 'Suporte', preDescription: 'Preciso de suporte', description: 'Atendimento geral', emoji: '📋', banner: '', purchaseDetection: true }],
      hoursEnabled: false,
      allowOutsideHours: true,
      hoursByDay: Array.from({ length: 7 }, () => ({ active: false, openAt: '09:00', closeAt: '18:00' })),
      postedMessages: [],
    },
    automations: criarEstadoPadraoAutomacoes(),
    balance: { enabled: false, users: {}, history: [] },
    positions: Array.from({ length: POSITION_LIMIT }, (_, i) => ({ index: i + 1, roleId: null, amount: null })),
    badges: [],
    badgeSettings: { enabled: false, dm: true, announcements: false, announcementChannel: null, display: true },
    tempRoles: [],
    tempRoleSettings: { enabled: false, removeExpired: true, notifyDm: true },
    storeOauth: { required: false },
    emojis: { synced: {}, animated: {}, lastSyncAt: null },
    customization: {
      colors: { default: '#FFFFFF', processing: '#fcba03', success: '#39fc03', error: '#ff0000', finished: '#7363ff' },
      bot: { nickname: '', avatar: '', banner: '', status: 'Online', status1: '', status2: '' },
      brand: { qrLogo: '', qrColor: '#111827' },
      publicLog: { enabled: false, v2: true, image: '', showBuy: true, showFeedback: true },
      feedbackDm: {
        message: '{saudacao} {usuario}. Se você curtiu sua compra, **que tal deixar uma avaliação?** Isso nos motiva, ajuda quem está em dúvida e ainda contribui para que a gente continue oferecendo serviços cada vez melhores pra você! 😊.',
        buttonText: 'Clique aqui e deixe seu feedback ;)',
      },
      productMessages: { v2: false, sideColor: '' },
    },
    stats: { salesToday: 0, salesTotal: 0, countToday: 0, countTotal: 0 },
    purchases: [],
    giveaways: [],
    carts: [],
    cartSequence: 0,
    cartSettings: { expirationMinutes: 30 },
    invitations: {},
    subscriptions: [],
    stockRequests: [],
    tickets: [],
    cloud: {
      linked: false,
      syncedMembers: null,
      serverId: null,
      verifiedRoleId: null,
      webhookUrl: null,
    },
    protect: {
      moderation: false,
      antiraid: false,
      antiSpam: false,
      antiLinks: false,
      antiMassMention: false,
      logChannel: null,
      raidLimit: 8,
      raidWindowSeconds: 10,
      raidPunishment: 'Bloquear entradas temporariamente',
      selfBot: { enabled: false, logChannel: null, limit: 4 },
      antiInvite: { enabled: false, logChannel: null, whitelistRoles: [] },
    },
    antiFake: { enabled: false, minimumAccountDays: 7, action: 'Registrar em log' },
  };
}

export function mergeDefaults(target, defaults) {
  for (const [key, value] of Object.entries(defaults)) {
    if (target[key] === undefined) {
      target[key] = value;
    } else if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      mergeDefaults(target[key], value);
    }
  }
  return target;
}

export function guildState(guildId) {
  state.guilds[guildId] = mergeDefaults(state.guilds[guildId] || {}, defaultGuildState());
  normalizarEstadoAutomacoes(state.guilds[guildId]);
  if (state.guilds[guildId].customization.feedbackDm.message === 'Obrigado pela compra! Clique abaixo para avaliar seu atendimento.') {
    state.guilds[guildId].customization.feedbackDm = { ...defaultGuildState().customization.feedbackDm };
  }
  applySyncedEmojiOverrides(state.guilds[guildId]);
  return state.guilds[guildId];
}

export function userDraft(userId) {
  state.drafts[userId] ??= {};
  return state.drafts[userId];
}
