import { MessageFlags } from 'discord.js';
import { state, guildState } from '../database/estado.js';

const IGNORAR = new Set([10062, 40060]);

/** Botões que funcionam na DM (ticket encerrado, entrega, etc.) */
const ACOES_DM = new Set([
  'ticket-transcript',
  'ticket-reopen',
  'delivery-copy',
  'delivery-restock',
]);

function efemero(payload = {}) {
  const { ephemeral, flags, ...rest } = payload;
  const base = typeof flags === 'number' ? flags : 0;
  return {
    ...rest,
    flags: ephemeral === false ? flags : base | MessageFlags.Ephemeral,
  };
}

async function responderErro(interaction, error) {
  if (!interaction?.isRepliable?.()) return;
  if (IGNORAR.has(error?.code)) return;

  const payload = efemero({
    content: `Erro ao processar: ${error?.message || 'falha desconhecida'}`,
  });

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (err) {
    if (!IGNORAR.has(err?.code)) console.error(err);
  }
}

function acaoDoCustomId(customId = '') {
  // zend:ticket-transcript:uuid → ticket-transcript
  const parts = String(customId).split(':');
  return parts[1] || parts[0] || '';
}

/** Resolve estado da guild a partir da DM (ticket/carrinho salvos) */
function resolverGsDaDm(interaction) {
  const parts = String(interaction.customId || '').split(':');
  const action = parts[1];
  const refId = parts[2]; // ticket id / cart id / product id

  for (const [gid, gs] of Object.entries(state.guilds || {})) {
    if (action === 'ticket-transcript' || action === 'ticket-reopen') {
      const ticket = (gs.tickets || []).find(
        (t) => t.id === refId || t.functionId === refId || t.userId === interaction.user.id,
      );
      if (ticket || (action === 'ticket-reopen' && gs.ticket?.functions?.length)) {
        return { guildId: gid, gs: guildState(gid), ticket };
      }
    }
    if (action === 'delivery-copy') {
      const cart = (gs.carts || []).find((c) => c.id === refId || c.userId === interaction.user.id);
      if (cart) return { guildId: gid, gs: guildState(gid), cart };
    }
    if (action === 'delivery-restock') {
      // qualquer guild do user — usa a primeira com products
      if (gs.products?.length) return { guildId: gid, gs: guildState(gid) };
    }
  }

  // fallback: primeira guild do bot
  const firstId = Object.keys(state.guilds || {})[0];
  if (firstId) return { guildId: firstId, gs: guildState(firstId) };
  return null;
}

export function registrarEventoInteracoes(
  client,
  {
    guildState: gsFn,
    handleSlashCommand,
    handleModal,
    handleSelect,
    handleChannelSelect,
    handleButton,
    saveState,
  },
) {
  client.on('interactionCreate', async (interaction) => {
    try {
      // ── DM: só botões permitidos ─────────────────────────
      if (!interaction.guild) {
        if (!interaction.isButton()) {
          if (interaction.isRepliable()) {
            await interaction.reply(
              efemero({ content: 'Use este bot dentro de um servidor.' }),
            );
          }
          return;
        }

        const acao = acaoDoCustomId(interaction.customId);
        if (!ACOES_DM.has(acao)) {
          await interaction.reply(
            efemero({ content: 'Use este botão dentro do servidor.' }),
          );
          return;
        }

        const resolved = resolverGsDaDm(interaction);
        if (!resolved?.gs) {
          await interaction.reply(
            efemero({ content: '❌ | Não encontrei os dados deste botão.' }),
          );
          return;
        }

        // Anexa guild resolvida se o bot estiver nela (openTicket precisa)
        if (resolved.guildId && !interaction.guild) {
          const g = await interaction.client.guilds.fetch(resolved.guildId).catch(() => null);
          if (g) {
            // não dá pra setar interaction.guild, mas openTicket usa interaction.guild
            // Para reopen em DM, o handler já trata !interaction.guild
          }
        }

        await handleButton(interaction, resolved.gs);
        saveState().catch((err) => console.error('[state]', err));
        return;
      }

      // ── Servidor ────────────────────────────────────────
      const gs = gsFn(interaction.guild.id);

      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction, gs);
        saveState().catch((err) => console.error('[state]', err));
        return;
      }

      if (interaction.isModalSubmit()) {
        await handleModal(interaction, gs);
        saveState().catch((err) => console.error('[state]', err));
        return;
      }

      // String / Role / User / Mentionable selects
      if (
        interaction.isStringSelectMenu() ||
        interaction.isRoleSelectMenu?.() ||
        interaction.isUserSelectMenu?.() ||
        interaction.isMentionableSelectMenu?.()
      ) {
        await handleSelect(interaction, gs);
        saveState().catch((err) => console.error('[state]', err));
        return;
      }

      if (interaction.isChannelSelectMenu()) {
        await handleChannelSelect(interaction, gs);
        saveState().catch((err) => console.error('[state]', err));
        return;
      }

      if (interaction.isButton()) {
        await handleButton(interaction, gs);
        saveState().catch((err) => console.error('[state]', err));
      }
    } catch (error) {
      if (!IGNORAR.has(error?.code)) {
        console.error('[interacao]', error);
      }
      await responderErro(interaction, error);
    }
  });
}
