/**
 * Atualiza painéis de automação de forma confiável.
 * (Evita bugs do fluxo genérico V2 em painéis clássicos com embeds + selects)
 */

const IGNORAR = new Set([10062, 40060]);

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {{ content?: string|null, embeds?: any[], components?: any[] }} payload
 */
export async function atualizarPainelAutomacao(interaction, payload) {
  const data = {
    content: payload.content ?? null,
    embeds: payload.embeds ?? [],
    components: payload.components ?? [],
  };

  try {
    // Modal submit vindo de botão na mensagem
    if (interaction.isModalSubmit?.()) {
      if (!interaction.deferred && !interaction.replied) {
        // Preferir deferUpdate para editar a mensagem original do painel
        if (interaction.isFromMessage?.()) {
          await interaction.deferUpdate();
          await interaction.editReply(data);
          return true;
        }
        await interaction.reply({ ...data, ephemeral: true });
        return true;
      }
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(data).catch(async () => {
          await interaction.message?.edit(data).catch(() => null);
        });
        return true;
      }
    }

    // Botão / select / role / channel
    if (!interaction.replied && !interaction.deferred) {
      // update é o caminho mais estável para painéis com RoleSelect/ChannelSelect
      await interaction.update(data);
      return true;
    }

    await interaction.editReply(data);
    return true;
  } catch (err) {
    if (IGNORAR.has(err?.code)) return false;
    console.error('[automacao-painel]', err.message || err);

    // Fallback: tenta editar a mensagem do componente diretamente
    try {
      if (interaction.message?.editable) {
        await interaction.message.edit(data);
        if (!interaction.replied && !interaction.deferred && interaction.isRepliable?.()) {
          // ack a interação se ainda não foi
          await interaction.deferUpdate().catch(() => null);
        }
        return true;
      }
    } catch (err2) {
      console.error('[automacao-painel-fallback]', err2.message || err2);
    }

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ Não foi possível atualizar o painel: ${err.message || 'erro'}`,
          ephemeral: true,
        });
      } else {
        await interaction.followUp({
          content: `❌ Não foi possível atualizar o painel: ${err.message || 'erro'}`,
          ephemeral: true,
        });
      }
    } catch {
      /* ignore */
    }
    return false;
  }
}

export async function avisoAutomacao(interaction, texto) {
  await interaction
    .followUp({ content: `✅ | ${texto}`, ephemeral: true })
    .catch(() => null);
}
