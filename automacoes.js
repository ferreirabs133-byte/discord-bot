const convitesPorServidor = new Map();

function mapaDeUsos(convites) {
  return new Map([...convites.values()].map((invite) => [invite.code, Number(invite.uses || 0)]));
}

async function carregarConvites(guild) {
  const invites = await guild.invites.fetch().catch(() => null);
  if (invites) convitesPorServidor.set(guild.id, mapaDeUsos(invites));
}

function pareceFeedbackNegativo(content) {
  return /\b(ruim|péssim|pessim|horrível|horrivel|golpe|scam|demora|não gostei|nao gostei|problema)\b/i.test(content);
}

export function registrarEventosAutomacoes(client, { guildState, saveState, sendConfiguredLog, embed }) {
  client.once('clientReady', async () => {
    for (const guild of client.guilds.cache.values()) await carregarConvites(guild);
  });

  client.on('inviteCreate', async (invite) => carregarConvites(invite.guild));
  client.on('inviteDelete', async (invite) => carregarConvites(invite.guild));

  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    const gs = guildState(message.guild.id);
    const config = gs.automations.feedback;
    if (!config.enabled || config.channel !== message.channelId) return;

    if (config.reactionEmoji) await message.react(config.reactionEmoji).catch(() => null);
    if (pareceFeedbackNegativo(message.content) && gs.channels.system) {
      await sendConfiguredLog(message.guild, gs.channels.system, {
        embeds: [embed(
          'Feedback negativo detectado',
          `**Usuário:** ${message.author}\n**Canal:** ${message.channel}\n**Mensagem:**\n${message.content.slice(0, 1500)}\n\n[Ir para a mensagem](${message.url})`,
          message.guild,
          'Monitor de feedbacks',
        ).setColor(0xe60000)],
      });
    }
  });

  client.on('guildMemberAdd', async (member) => {
    const gs = guildState(member.guild.id);
    const config = gs.automations.invite;
    if (!config.enabled) return;

    const atuais = await member.guild.invites.fetch().catch(() => null);
    if (!atuais) return;
    const anteriores = convitesPorServidor.get(member.guild.id) || new Map();
    const usado = [...atuais.values()].find((invite) => Number(invite.uses || 0) > Number(anteriores.get(invite.code) || 0));
    convitesPorServidor.set(member.guild.id, mapaDeUsos(atuais));
    if (!usado?.inviterId) return;

    const accountDays = Math.floor((Date.now() - member.user.createdTimestamp) / 86_400_000);
    const fake = accountDays < Number(config.minimumAccountDays || 7);
    const registro = gs.invitations[usado.inviterId] ||= { count: 0, fake: 0, leaves: 0, invitedUsers: [] };
    registro.count += 1;
    if (fake) registro.fake += 1;
    registro.invitedUsers.push({ userId: member.id, joinedAt: Date.now(), fake });

    for (const reward of config.rewards || []) {
      if (Number(registro.count) < Number(reward.invites) || !reward.roleId) continue;
      const inviter = await member.guild.members.fetch(usado.inviterId).catch(() => null);
      if (inviter && !inviter.roles.cache.has(reward.roleId)) await inviter.roles.add(reward.roleId, 'Recompensa de convites Zend').catch(() => null);
    }

    if (config.logChannel) {
      await sendConfiguredLog(member.guild, config.logChannel, {
        embeds: [embed(
          'Novo convite registrado',
          `**Novo membro:** ${member}\n**Convidado por:** <@${usado.inviterId}>\n**Código:** \`${usado.code}\`\n**Conta:** \`${accountDays} dias${fake ? ' · considerada fake' : ''}\``,
          member.guild,
          'Invite Tracker',
        ).setColor(fake ? 0xe60000 : 0x22c55e)],
      });
    }

    await saveState();
  });
}
