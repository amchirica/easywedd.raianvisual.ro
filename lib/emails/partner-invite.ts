import { brandMarkImgHtml } from "@/lib/brand";

type PartnerInviteVars = {
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string | null;
};

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "în curând";
  try {
    return new Intl.DateTimeFormat("ro-RO", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(expiresAt));
  } catch {
    return expiresAt;
  }
}

export function renderPartnerInviteEmail(vars: PartnerInviteVars): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = formatExpiry(vars.expiresAt);
  const subject = "Ai fost invitat(ă) în EasyWedd";
  const mark = brandMarkImgHtml(28);

  const text = [
    `${vars.inviterName} te-a invitat(ă) să colaborezi pe EasyWedd.`,
    `Spațiu: ${vars.workspaceName}`,
    `Rol: ${vars.role}`,
    `Acceptă invitația: ${vars.inviteUrl}`,
    `Invitația expiră: ${expiry}`,
    "",
    "Dacă nu te așteptai la acest mesaj, îl poți ignora.",
  ].join("\n");

  const html = `<!doctype html>
<html>
<body style="font-family:Georgia,serif;color:#2A2420;background:#F7F4EF;padding:24px;margin:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #e7dfd2">
    <tr>
      <td style="padding:28px">
        <div style="margin:0 0 16px">${mark}</div>
        <p style="margin:0 0 12px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#8a7a68">EasyWedd</p>
        <h1 style="margin:0 0 16px;font-size:28px;font-weight:400;line-height:1.2">Ai fost invitat(ă)</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.5">
          <strong>${escapeHtml(vars.inviterName)}</strong> te invită să colaborezi la
          <strong>${escapeHtml(vars.workspaceName)}</strong>.
        </p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b5f52">
          Rol oferit: ${escapeHtml(vars.role)} · Expiră: ${escapeHtml(expiry)}
        </p>
        <p style="margin:0 0 24px">
          <a href="${escapeAttr(vars.inviteUrl)}"
             style="display:inline-block;background:#2A2420;color:#F7F4EF;text-decoration:none;padding:12px 20px;font-size:14px">
            Acceptă invitația
          </a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b5f52;word-break:break-all">
          Sau deschide acest link:<br/>
          ${escapeHtml(vars.inviteUrl)}
        </p>
        <p style="margin:20px 0 0;font-size:12px;color:#8a7a68">
          Dacă nu te așteptai la această invitație, poți ignora mesajul.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
