export function buildWhatsAppShareUrl(invitationUrl: string, coupleLabel: string) {
  const text = `Salut! Ești invitat(ă) la nunta ${coupleLabel}. Detalii și RSVP: ${invitationUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
