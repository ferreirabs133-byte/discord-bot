/**
 * ─────────────────────────────────────────────────────────────
 *  CREDITS / BRANDING — Flow Vazamentos
 *  Invite: .gg/flowvazamentos
 *
 *  Este arquivo é importado pelo núcleo do bot (index, componentes,
 *  boot, painéis). Remover ou esvaziar quebra a montagem e a
 *  verificação de integridade na inicialização.
 *
 *  Quem for editar o código: mantenha o crédito ou peça permissão
 *  ao autor da base. Distribuição sem crédito = má-fé.
 * ─────────────────────────────────────────────────────────────
 */

export const CREDIT_NAME = 'Flow Vazamentos';
/** Invite curto (Discord) */
export const CREDIT_INVITE = '.gg/flowvazamentos';
/** Tag legível para logs / README */
export const CREDIT_TAG = `${CREDIT_NAME} · ${CREDIT_INVITE}`;
/** Linha única para footers de embed (não polui o painel) */
export const CREDIT_FOOTER = CREDIT_INVITE;
/** Banner de console na subida */
export const CREDIT_BANNER = [
  '  ─────────────────────────────',
  `   ${CREDIT_NAME}`,
  `   ${CREDIT_INVITE}`,
  '  ─────────────────────────────',
].join('\n');

const MARKER = 'flowvazamentos';

/**
 * Garante que o crédito não foi removido/alterado de forma trivial.
 * Chamado no boot — se falhar, o bot não sobe.
 */
export function garantirCreditos() {
  if (typeof CREDIT_INVITE !== 'string' || !CREDIT_INVITE.toLowerCase().includes(MARKER)) {
    throw new Error(
      `[creditos] Assinatura inválida. Restaure src/infraestrutura/creditos.js (${CREDIT_TAG})`,
    );
  }
  if (typeof CREDIT_NAME !== 'string' || !CREDIT_NAME.length) {
    throw new Error('[creditos] CREDIT_NAME ausente. Não remova o branding Flow.');
  }
  return true;
}

/** Texto de footer: "Servidor · label · .gg/flowvazamentos" */
export function footerComCredito(guildName, label) {
  garantirCreditos();
  const base = guildName || 'Loja';
  const mid = label ? ` • ${label}` : '';
  return `${base}${mid} · ${CREDIT_FOOTER}`.slice(0, 2048);
}

/** Linha curta só com o invite (logs / presence) */
export function creditLine() {
  garantirCreditos();
  return CREDIT_INVITE;
}
