/** Shared masking helpers — safe for client or server import. */

export function maskId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.length <= 10) return `${id.slice(0, 2)}…`;
  return `${id.slice(0, 6)}…${id.slice(-3)}`;
}

export function maskEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  const head = local.slice(0, 1) || "*";
  return `${head}***@${domain}`;
}
