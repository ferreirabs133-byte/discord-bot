export function registrarEventoEntradaMembro(client, { guildState, sendConfiguredLog, embed, parseHex, renderWelcome }) {
  client.on('guildMemberAdd', async (member) => {
  const gs = guildState(member.guild.id);
  const accountDays = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
  if (gs.antiFake.enabled && accountDays < gs.antiFake.minimumAccountDays && gs.channels.entries) {
    await sendConfiguredLog(member.guild, gs.channels.entries, {
      embeds: [embed(
        '🕵️ Entrada suspeita detectada',
        `**Usuário:** ${member}\n**Conta criada há:** \`${accountDays} dia(s)\`\n**Mínimo configurado:** \`${gs.antiFake.minimumAccountDays} dias\`\n**Ação:** \`${gs.antiFake.action}\``,
        member.guild,
        'Anti-Fake',
      ).setColor(parseHex(gs.customization.colors.error))],
    });
  }
  if (!gs.welcome.enabled || !gs.channels.welcome) return;
  const channel = await member.guild.channels.fetch(gs.channels.welcome).catch(() => null);
  if (!channel?.isTextBased()) return;
  const message = renderWelcome(gs.welcome.message, member);
  const welcomeEmbed = embed(gs.welcome.title, message, member.guild).setColor(parseHex(gs.welcome.color));
  if (gs.welcome.image) welcomeEmbed.setImage(gs.welcome.image);
  const sent = gs.welcome.embed
    ? await channel.send({ embeds: [welcomeEmbed] })
    : await channel.send(message);
  if (gs.welcome.autoDeleteSeconds > 0) {
    setTimeout(() => sent.delete().catch(() => {}), gs.welcome.autoDeleteSeconds * 1000);
  }
});
}
