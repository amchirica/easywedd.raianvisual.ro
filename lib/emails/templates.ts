export type EmailTemplateId =
  | "welcome"
  | "partner_invite"
  | "task_reminder"
  | "payment_reminder"
  | "rsvp_reminder"
  | "rsvp_confirm"
  | "website_published"
  | "plan_expiring"
  | "payment_succeeded"
  | "payment_failed";

export const EMAIL_TEMPLATE_META: Record<
  EmailTemplateId,
  { subject: string; category: "transactional" | "reminder" | "marketing" }
> = {
  welcome: { subject: "Bine ai venit pe EasyWedd", category: "transactional" },
  partner_invite: {
    subject: "Ai fost invitat(ă) în EasyWedd",
    category: "transactional",
  },
  task_reminder: { subject: "Reminder task nuntă", category: "reminder" },
  payment_reminder: { subject: "Reminder plată", category: "reminder" },
  rsvp_reminder: { subject: "Reminder RSVP", category: "reminder" },
  rsvp_confirm: { subject: "Confirmare RSVP", category: "transactional" },
  website_published: {
    subject: "Website-ul nunții este public",
    category: "transactional",
  },
  plan_expiring: { subject: "Planul tău expiră curând", category: "reminder" },
  payment_succeeded: { subject: "Plată reușită", category: "transactional" },
  payment_failed: { subject: "Plată eșuată", category: "transactional" },
};

export function renderEmailHtml(
  id: EmailTemplateId,
  vars: Record<string, string>,
) {
  const body: Record<EmailTemplateId, string> = {
    welcome: `<p>Salut${vars.name ? `, ${vars.name}` : ""}!</p><p>Contul tău EasyWedd este gata.</p>`,
    partner_invite: `<p>Ai fost invitat(ă) pe EasyWedd.</p><p><a href="${vars.url ?? "#"}">Acceptă invitația</a></p>`,
    task_reminder: `<p>Reminder: ${vars.taskTitle ?? "un task"} are termen apropiat.</p>`,
    payment_reminder: `<p>Ai o plată programată: ${vars.amount ?? ""}.</p>`,
    rsvp_reminder: `<p>Te rugăm să completezi RSVP: <a href="${vars.url ?? "#"}">link</a></p>`,
    rsvp_confirm: `<p>Mulțumim! Răspunsul RSVP a fost înregistrat (${vars.status ?? ""}).</p>`,
    website_published: `<p>Website-ul este live: <a href="${vars.appUrl ?? ""}/w/${vars.slug ?? ""}">/w/${vars.slug ?? ""}</a></p>`,
    plan_expiring: `<p>Planul expiră la ${vars.date ?? "curând"}. Reînnoiește din Billing.</p>`,
    payment_succeeded: `<p>Plata pentru ${vars.product ?? "plan"} a fost confirmată.</p>`,
    payment_failed: `<p>Plata a eșuat. Actualizează metoda de plată din Billing.</p>`,
  };

  return `<!doctype html><html><body style="font-family:Georgia,serif;color:#2A2420;background:#F7F4EF;padding:24px">${body[id]}</body></html>`;
}
