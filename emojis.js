import fs from 'node:fs/promises';
import path from 'node:path';
import { EXTENSOES_EMOJI_ZEND, PASTA_EMOJIS_ZEND } from '../configuracoes/emojis-zend.js';

const EMOJI_ASSET_DIR = PASTA_EMOJIS_ZEND;
let salvarEstado = async () => {};

export function configurarPersistenciaEmoji(fn) {
  salvarEstado = typeof fn === 'function' ? fn : async () => {};
}

export const EMOJI = {
  store: '🛒',
  support: '🎫',
  welcome: '👋',
  refresh: '🔄',
  roller: '🎨',
  cloud: '☁️',
  receipt: '🧾',
  celebration: '🎉',
  settings: '⚙️',
  secured: '🛡️',
  plus: '<:plus:1427529469836660737>',
  title: '<:title:1326691544253726773>',
  left: '⬅️',
  check: '✅',
  cancel: '✖️',
  trash: '🗑️',
  fields: '📋',
  coupon: '🎟️',
  visible: '<:visible:1326690890449813588>',
  heart: '<:hearth:1326690846405300224>',
  role: '<:role:1326691243253698640>',
  pin: '📌',
  stock: '📦',
  search: '🔎',
  route: '🧭',
  wallet: '<:wallet:1326691393866961038>',
  clock: '<:clock:1326690798581977098>',
  warning: 'ℹ️',
  lightning: '<:lightning:1326690855091699772>',
  forum: '<:forum:1326691210433400883>',
  sparks: '<:sparks:1326691101469573152>',
  activity: '<:activity:1326691180179619873>',
  shield: '🛡️',
  verifiedDuo: '✅',
  genesisClock: '⏱️',
  lockEmoji: '🔒',
  unlockEmoji: '🔓',
  syncMessages: '📑',
};

Object.assign(EMOJI, {
  store: '<:store:1326691404646453248>',
  support: '<:support:1328931053364183081>',
  welcome: '<:welcome:1415098749528838184>',
  refresh: '<a:refresh:1321317638328160256>',
  roller: '<:roller:1326691095475654747>',
  cloud: '<:cloud:1326690954601566299>',
  receipt: '<:receipt:1326691401211056248>',
  celebration: '<a:celebration:1321317631923327027>',
  settings: '<:settings:1326690879729307669>',
  secured: '<:Secured:1415098066251415664>',
  plus: '<:plus:1427529469836660737>',
  title: '<:title:1326691544253726773>',
  left: '<:left:1326690853510451295>',
  check: '<:check:1326690796992204850>',
  cancel: '✖️',
  trash: '🗑️',
  fields: '📋',
  coupon: '🎟️',
  visible: '<:visible:1326690890449813588>',
  heart: '<:hearth:1326690846405300224>',
  role: '<:role:1326691243253698640>',
  pin: '📌',
  stock: '📦',
  search: '🔎',
  route: '🧭',
  wallet: '<:wallet:1326691393866961038>',
  clock: '<:clock:1326690798581977098>',
  warning: '<:infogenesiss:1518014522344869928>',
  lightning: '<:lightning:1326690855091699772>',
  forum: '<:forum:1326691210433400883>',
  sparks: '<:sparks:1326691101469573152>',
  activity: '<:activity:1326691180179619873>',
  shield: '🛡️',
  verifiedDuo: '✅',
  genesisClock: '⏱️',
  lockEmoji: '🔒',
  unlockEmoji: '🔓',
  syncMessages: '📑',
  genesisTicket: '<:genesisTicket:1518014529546616962>',
  seta: '<a:setaAnimada:1518014526111481927>',
  yes: '<:genesisYes:1518014527176966184>',
  no: '<:genesisNoC:1518014528426741951>',
  verified: '<:verifieldgenesiss:1518014521032048740>',
  loading: '<a:loadinggenesiss:1518014523049508924>',
  memberCloud: '<:zendMemberGr:1518014537360609412>',
  backup: '<:zendBackupEmoji:1518014539596042352>',
  folder: '<:folder:1326691072272764929>',
  users: '<:users:1326691236685283368>',
  url: '<:url:1326691538767450233>',
  trashcan: '<:trashcan:1326691250543398913>',
  yesgenesis: '<:yesgenesiss:1518014523934511135>',
  account: '<:account:1326690792302973071>',
  syncBlue: '<:Sincronizar:1238303687248576544>',
  syncGreen: '<:Sincronizar:1259569896472182784>',
  edit: '<:Editar:1237192698746634331>',
  textChannel: '<:textc:1326691248555167765>',
  activityIcon: '<:activity:1326691180179619873>',
  redTrash: '<:lixeiraRed:1518014521778901203>',
  cartLoaded: '<:icons8carrinhodecomprascarregado:1467991304268152965>',
  giveaway: '<a:zendGiveaway:1518014540565053520>',
  notifyMember: '<:2904notifymember:1415393789337538650>',
  upload: '<:upload:1415098265589907476>',
  efi: '<:efi:1306786969652564091>',
  mercadoPago: '<:imp_mercadopago:1295039458403553340>',
  pix: '<:p7dro_pix:1307033195069444116>',
  pushInPay: '<:pushInPay:1415412932480729098>',
  litecoin: '<:imp_llitecoin:1256710417343053866>',
  bank: '<:banco2:1328931951846883338>',
  carrinhoZend: '<:carrinhoZend:1463985148348465336>',
  ea1: '<:ea1:1518014575738359829>',
  ea2: '<:ea2:1518014584407986256>',
  ea3: '<:ea3:1518014593157435533>',
  ea4: '<:ea4:1518014601579593890>',
  ea5: '<:ea5:1518014609376678112>',
  ea6: '<:ea6:1518014618033717248>',
  ea7: '<:ea7:1518014626594427021>',
  ea8: '<:ea8:1518014721339429014>',
  zendCart: '<:zendCart:1518014548903198845>',
  zendPay: '<:zendPay:1518014549989789790>',
  aceitar: '<:Aceitar:1237192700273365114>',
  ticketZend: '<:Ticket:1236447625675407463>',
  deleteZend: '<:delete:1246953338541441036>',
  pixZend: '<:Pix:1238293609380450304>',
  litecoinZend: '<:litecoinemojidocalai:1256688031088513064>',
  cardZend: '<:cpfnanotaeolhela:1256688008653045831>',
  arrowZend: '<:Arrow:1237191329432211468>',
  copiaCola: '<:copicola:1192868868784394381>',
  entregaSucess: '<:entregaSucess:1518014525398454282>',
  editStock: '<:editestoque:1187479020040884286>',
});

export const POSITION_LIMIT = 5;
export const POSITION_EMOJIS = ['🥇', '🥈', '🥉', '🏅', '🎖️'];

export const EMOJI_FILE_EXTENSIONS = EXTENSOES_EMOJI_ZEND;
export const EMOJI_ALIASES = {
  infogenesiss: ['warning'],
  genesisPrancheta: ['clipboard'],
  zendTrofeu: ['trophy'],
  zendUsers: ['users'],
  genesisYes: ['yes'],
  genesisNoC: ['no'],
  yesgenesiss: ['yesgenesis'],
  setaAnimada: ['seta'],
  Aceitar: ['aceitar'],
  Ticket: ['ticketZend'],
  delete: ['deleteZend'],
  Pix: ['pixZend'],
  litecoinemojidocalai: ['litecoinZend'],
  cpfnanotaeolhela: ['cardZend'],
  Arrow: ['arrowZend'],
  copicola: ['copiaCola'],
  editestoque: ['editStock'],
  activity: ['activityIcon'],
  Sincronizar: ['syncBlue', 'syncGreen'],
  syncMessages: ['syncMessages'],
  genesisVerifieldDuo: ['verifiedDuo'],
  genesisClock: ['genesisClock'],
  lockEmoji: ['lockEmoji'],
  unlockEmoji: ['unlockEmoji'],
};

export const EMOJI_ALIAS_FALLBACKS = {
  clipboard: '📋',
  trophy: '🏆',
};

export function renderCustomEmojis(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/:([A-Za-z0-9_]+):/g, (match, name, offset, fullText) => {
    if (fullText[offset - 1] === '<' || fullText.slice(offset - 2, offset) === '<a') return match;
    const aliases = EMOJI_ALIASES[name] || [name];
    for (const alias of aliases) {
      if (EMOJI[alias]) return EMOJI[alias];
      if (EMOJI_ALIAS_FALLBACKS[alias]) return EMOJI_ALIAS_FALLBACKS[alias];
    }
    return match;
  });
}

export function emojiTag(name, emojiId, animated = false) {
  return `<${animated ? 'a' : ''}:${name}:${emojiId}>`;
}

export function normalizeEmojiName(fileName) {
  const clean = path.parse(fileName).name.replace(/[^\w]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return (clean || 'zendemoji').slice(0, 32);
}

export function applySyncedEmojiOverrides(gs) {
  const synced = gs?.emojis?.synced || {};
  const animated = gs?.emojis?.animated || {};
  for (const [name, emojiId] of Object.entries(synced)) {
    const tag = emojiTag(name, emojiId, Boolean(animated[name]));
    EMOJI[name] = tag;
    for (const alias of EMOJI_ALIASES[name] || []) EMOJI[alias] = tag;
  }
}

export async function localEmojiFiles() {
  const entries = await fs.readdir(EMOJI_ASSET_DIR, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const seen = new Set();
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!EMOJI_FILE_EXTENSIONS.has(ext)) continue;
    const name = normalizeEmojiName(entry.name);
    if (seen.has(name)) continue;
    seen.add(name);
    files.push({
      name,
      animated: ext === '.gif',
      path: path.join(EMOJI_ASSET_DIR, entry.name),
    });
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export function syncedEmojiOptions(gs) {
  return Object.entries(gs.emojis?.synced || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 25)
    .map(([name, emojiId]) => ({
      label: name,
      value: name,
      emoji: { name, id: emojiId, animated: Boolean(gs.emojis?.animated?.[name]) },
    }));
}

export function emojiSyncSummary(result) {
  return [
    `${EMOJI.yes || 'OK'} Emojis do clone Zend sincronizados no aplicativo do bot.`,
    'Os arquivos continuam em `discord-emojis/upload` e nao ocupam limite de emojis do servidor.',
    `Criados: \`${result.created.length}\``,
    `Reutilizados: \`${result.reused.length}\``,
    `Falhas: \`${result.failed.length}\``,
    result.failed.length ? result.failed.map((item) => `- ${item.name}: ${item.error}`).join('\n') : '',
  ].filter(Boolean).join('\n');
}

export async function syncLocalEmojis(guild, gs, onProgress) {
  const files = await localEmojiFiles();
  if (!files.length) {
    return { created: [], reused: [], failed: [{ name: 'discord-emojis/upload', error: 'Nenhum arquivo de emoji local encontrado.' }] };
  }

  const application = guild.client.application;
  if (!application?.emojis?.fetch || !application?.emojis?.create) {
    return { created: [], reused: [], failed: [{ name: 'aplicacao', error: 'A versao atual do cliente nao suporta emojis de aplicacao.' }] };
  }

  await application.emojis.fetch().catch(() => null);
  gs.emojis ??= { synced: {}, animated: {}, lastSyncAt: null };
  gs.emojis.synced ??= {};
  gs.emojis.animated ??= {};
  gs.emojis.scope = 'application';

  const result = { created: [], reused: [], failed: [] };
  for (const file of files) {
    const existing = application.emojis.cache.find((emoji) => emoji.name === file.name);
    if (existing) {
      gs.emojis.synced[file.name] = existing.id;
      gs.emojis.animated[file.name] = existing.animated ?? file.animated;
      result.reused.push(file.name);
      gs.emojis.lastSyncAt = Date.now();
      applySyncedEmojiOverrides(gs);
      await salvarEstado();
      onProgress?.({ status: 'reused', name: file.name });
      continue;
    }

    try {
      const created = await application.emojis.create({
        attachment: file.path,
        name: file.name,
      });
      gs.emojis.synced[file.name] = created.id;
      gs.emojis.animated[file.name] = created.animated ?? file.animated;
      result.created.push(file.name);
      gs.emojis.lastSyncAt = Date.now();
      applySyncedEmojiOverrides(gs);
      await salvarEstado();
      onProgress?.({ status: 'created', name: file.name });
    } catch (error) {
      result.failed.push({ name: file.name, error: error.message });
      onProgress?.({ status: 'failed', name: file.name, error: error.message });
    }
  }

  gs.emojis.lastSyncAt = Date.now();
  applySyncedEmojiOverrides(gs);
  await salvarEstado();
  return result;
}
