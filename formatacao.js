export function parseHex(hex) {
  const clean = String(hex || '').replace('#', '');
  return Number.parseInt(clean || '2b2d31', 16) || 0x2b2d31;
}

export function renderWelcome(template, member) {
  return template
    .replaceAll('{member}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{displayname}', member.displayName)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{membercount}', String(member.guild.memberCount))
    .replaceAll('{createdat}', `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
    .replaceAll('{accountage}', String(Math.floor((Date.now() - member.user.createdTimestamp) / 86400000)));
}

export function renderFeedback(template, user) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return String(template || '')
    .replaceAll('{saudacao}', greeting)
    .replaceAll('{usuario}', `<@${user.id}>`);
}