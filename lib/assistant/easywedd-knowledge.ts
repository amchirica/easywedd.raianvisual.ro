import type { KnowledgeEntry } from "@/lib/assistant/types";

/**
 * Trusted static knowledge about real EasyWedd features.
 * Do not invent modules here — only describe what exists in the product.
 */
export const EASYWEDD_KNOWLEDGE: KnowledgeEntry[] = [
  {
    key: "overview",
    route: "/dashboard",
    featureKey: null,
    keywords: {
      ro: ["dashboard", "prezentare", "overview", "acasă", "ce pot face", "început"],
      en: ["dashboard", "overview", "home", "what can i do", "start"],
    },
    title: { ro: "Prezentare", en: "Overview" },
    description: {
      ro: "Ecranul principal al nunții: countdown, progres, rezumate pentru invitați, buget, task-uri și plăți apropiate.",
      en: "Your wedding home screen: countdown, progress, and summaries for guests, budget, tasks, and upcoming payments.",
    },
    actions: {
      ro: ["Vezi countdown-ul", "Urmărește progresul", "Deschide modulele din meniu"],
      en: ["See the countdown", "Track progress", "Open modules from the menu"],
    },
    steps: {
      ro: [
        "Deschide Prezentare din meniul din stânga.",
        "Folosește cardurile de rezumat pentru a sări la Invitați, Buget sau Planner.",
        "Completează datele nunții din secțiunea Nunta dacă încă lipsesc.",
      ],
      en: [
        "Open Overview from the left menu.",
        "Use summary cards to jump to Guests, Budget, or Planner.",
        "Fill wedding details under Wedding if anything is missing.",
      ],
    },
    limitations: {
      ro: ["Nu înlocuiește modulele detaliate — este un rezumat."],
      en: ["It does not replace detailed modules — it is a summary."],
    },
  },
  {
    key: "wedding",
    route: "/dashboard/wedding",
    featureKey: "planner",
    keywords: {
      ro: ["nuntă", "data", "locație", "detalii", "modific data", "eveniment"],
      en: ["wedding", "date", "venue", "details", "change date", "event"],
    },
    title: { ro: "Nunta", en: "Wedding" },
    description: {
      ro: "Detaliile evenimentului: data, locație, status și informații de bază ale nunții.",
      en: "Event details: date, venue, status, and basic wedding information.",
    },
    actions: {
      ro: ["Modifică data nunții", "Actualizează locația", "Salvează detaliile"],
      en: ["Change the wedding date", "Update the venue", "Save details"],
    },
    steps: {
      ro: [
        "Mergi la Nunta din meniu.",
        "Editează data, locația și celelalte câmpuri.",
        "Salvează modificările.",
      ],
      en: [
        "Go to Wedding in the menu.",
        "Edit the date, venue, and other fields.",
        "Save your changes.",
      ],
    },
    limitations: {
      ro: ["Unele câmpuri pot fi limitate de rolul tău în workspace."],
      en: ["Some fields may be limited by your workspace role."],
    },
  },
  {
    key: "planner",
    route: "/dashboard/planner",
    featureKey: "planner",
    keywords: {
      ro: [
        "planner",
        "task",
        "tasks",
        "checklist",
        "sarcină",
        "sarcini",
        "deadline",
        "responsabil",
        "de făcut",
        "todo",
      ],
      en: [
        "planner",
        "task",
        "tasks",
        "checklist",
        "todo",
        "deadline",
        "owner",
        "to do",
      ],
    },
    title: { ro: "Planner", en: "Planner" },
    description: {
      ro: "Checklist-ul nunții: task-uri cu deadline, responsabil și progres.",
      en: "Wedding checklist: tasks with deadlines, owners, and progress.",
    },
    actions: {
      ro: ["Adaugă task", "Marchează finalizat", "Setează deadline", "Atribuie responsabil"],
      en: ["Add a task", "Mark as done", "Set a deadline", "Assign an owner"],
    },
    steps: {
      ro: [
        "Deschide Planner.",
        "Adaugă un task nou cu titlu și termen.",
        "Atribuie un responsabil dacă lucrați în echipă.",
        "Bifează task-ul când e gata.",
      ],
      en: [
        "Open Planner.",
        "Add a new task with a title and due date.",
        "Assign an owner if you work as a team.",
        "Check it off when done.",
      ],
    },
    limitations: {
      ro: [
        "Vizualizarea Calendar din Planner arată task-uri după termen (due date), nu un calendar de evenimente separat.",
        "Pentru programul zilei nunții folosește Timeline.",
      ],
      en: [
        "Planner Calendar view shows tasks by due date — not a separate event calendar.",
        "Use Timeline for the wedding-day schedule.",
      ],
    },
  },
  {
    key: "calendar",
    route: "/dashboard/planner",
    featureKey: "planner",
    keywords: {
      ro: [
        "calendar",
        "vederea calendar",
        "view calendar",
        "due date",
        "termen",
        "unde e calendarul",
        "program pe zile",
      ],
      en: [
        "calendar",
        "calendar view",
        "due date",
        "deadline view",
        "where is calendar",
        "schedule by day",
      ],
    },
    title: { ro: "Calendar (Planner)", en: "Calendar (Planner)" },
    description: {
      ro: "În EasyWedd, „Calendar” este vizualizarea Planner pe termenele task-urilor (`/dashboard/planner?view=calendar`). Programul zilei evenimentului este în Timeline.",
      en: "In EasyWedd, “Calendar” is the Planner due-date view (`/dashboard/planner?view=calendar`). The wedding-day schedule lives in Timeline.",
    },
    actions: {
      ro: [
        "Deschide Planner → Calendar",
        "Adaugă task cu termen",
        "Vezi Timeline pentru programul zilei",
      ],
      en: [
        "Open Planner → Calendar",
        "Add a task with a due date",
        "Open Timeline for the day-of schedule",
      ],
    },
    steps: {
      ro: [
        "Mergi la Planner.",
        "Alege vizualizarea Calendar.",
        "Adaugă sau editează task-uri cu due date.",
        "Pentru orele ceremoniei/petrecerii, folosește Timeline.",
      ],
      en: [
        "Go to Planner.",
        "Switch to Calendar view.",
        "Add or edit tasks with due dates.",
        "For ceremony/party times, use Timeline.",
      ],
    },
    limitations: {
      ro: ["Nu există un modul Calendar separat de tip Google Calendar."],
      en: ["There is no separate Google Calendar–style module."],
    },
  },
  {
    key: "budget",
    route: "/dashboard/budget",
    featureKey: "budget",
    keywords: {
      ro: ["buget", "cost", "plată", "cheltuieli", "estimat", "restant", "unde văd bugetul"],
      en: ["budget", "cost", "payment", "expense", "estimated", "remaining", "where is budget"],
    },
    title: { ro: "Buget", en: "Budget" },
    description: {
      ro: "Urmărește bugetul total, estimările, sumele contractate, plătite și restante pe categorii și furnizori.",
      en: "Track total budget, estimates, contracted amounts, paid and remaining by category and vendor.",
    },
    actions: {
      ro: ["Adaugă linie de buget", "Actualizează sume", "Vezi restanțe", "Leagă de furnizor"],
      en: ["Add a budget line", "Update amounts", "See remaining", "Link to a vendor"],
    },
    steps: {
      ro: [
        "Deschide Buget din meniu.",
        "Adaugă o linie pe categorie (ex. foto, locație).",
        "Completează estimat / contractat / plătit.",
        "Revino periodic pentru a actualiza plățile.",
      ],
      en: [
        "Open Budget from the menu.",
        "Add a line by category (e.g. photo, venue).",
        "Fill estimated / contracted / paid.",
        "Come back regularly to update payments.",
      ],
    },
    limitations: {
      ro: [
        "EasyWedd nu oferă consultanță financiară.",
        "Nu sincronizează automat conturi bancare.",
      ],
      en: [
        "EasyWedd does not provide financial advice.",
        "It does not sync bank accounts automatically.",
      ],
    },
  },
  {
    key: "guests",
    route: "/dashboard/guests",
    featureKey: "guests",
    keywords: {
      ro: ["invitați", "invitat", "listă", "rsvp", "adaug invitat", "masă", "meniu", "alergii"],
      en: ["guests", "guest", "list", "rsvp", "add guest", "table", "menu", "allergies"],
    },
    title: { ro: "Invitați", en: "Guests" },
    description: {
      ro: "Lista de invitați: RSVP, familie/grup, masă, meniu, alergii, cazare și transport.",
      en: "Guest list: RSVP, family/group, table, menu, allergies, lodging, and transport.",
    },
    actions: {
      ro: ["Adaugă invitat", "Editează invitat", "Setează RSVP", "Asociază masă", "Importă listă"],
      en: ["Add guest", "Edit guest", "Set RSVP", "Assign table", "Import list"],
    },
    steps: {
      ro: [
        "Deschide Invitați.",
        "Apasă Adaugă invitat și completează numele.",
        "Setează statusul RSVP când primești răspunsul.",
        "Opțional: asociază masa din Seating după ce ai mese create.",
      ],
      en: [
        "Open Guests.",
        "Click Add guest and fill in the name.",
        "Set RSVP status when you get a reply.",
        "Optionally assign a table in Seating after tables exist.",
      ],
    },
    limitations: {
      ro: ["Limita de invitați depinde de planul de abonament."],
      en: ["Guest limits depend on your subscription plan."],
    },
  },
  {
    key: "seating",
    route: "/dashboard/seating",
    featureKey: "seating",
    keywords: {
      ro: ["seating", "mese", "plan mese", "așezare", "capacitate", "drag"],
      en: ["seating", "tables", "seating plan", "capacity", "drag"],
    },
    title: { ro: "Seating", en: "Seating" },
    description: {
      ro: "Planul meselor: creează mese, setează capacitatea și așază invitații.",
      en: "Seating plan: create tables, set capacity, and seat guests.",
    },
    actions: {
      ro: ["Adaugă masă", "Setează capacitate", "Așază invitați", "Rearanjează"],
      en: ["Add table", "Set capacity", "Seat guests", "Rearrange"],
    },
    steps: {
      ro: [
        "Deschide Seating.",
        "Creează mesele cu capacitatea dorită.",
        "Așază invitații pe mese (din listă sau drag & drop, după cum e disponibil).",
        "Verifică invitații neașezați înainte de eveniment.",
      ],
      en: [
        "Open Seating.",
        "Create tables with the desired capacity.",
        "Seat guests on tables (from the list or drag & drop, as available).",
        "Check unassigned guests before the event.",
      ],
    },
    limitations: {
      ro: ["Seating poate fi indisponibil pe planurile de bază."],
      en: ["Seating may be unavailable on basic plans."],
    },
  },
  {
    key: "vendors",
    route: "/dashboard/vendors",
    featureKey: "vendors",
    keywords: {
      ro: ["furnizori", "furnizor", "foto", "dj", "locație", "contract", "ofertă"],
      en: ["vendors", "vendor", "photo", "dj", "venue", "contract", "quote"],
    },
    title: { ro: "Furnizori", en: "Vendors" },
    description: {
      ro: "Evidența furnizorilor: contact, ofertă, contract, plăți, status și note.",
      en: "Vendor tracker: contact, quote, contract, payments, status, and notes.",
    },
    actions: {
      ro: ["Adaugă furnizor", "Salvează contact", "Notează ofertă/contract", "Urmărește plăți"],
      en: ["Add vendor", "Save contact", "Note quote/contract", "Track payments"],
    },
    steps: {
      ro: [
        "Deschide Furnizori.",
        "Adaugă un furnizor pe categorie (foto, DJ, locație etc.).",
        "Completează contactul și statusul.",
        "Leagă plățile de Buget când e cazul.",
      ],
      en: [
        "Open Vendors.",
        "Add a vendor by category (photo, DJ, venue, etc.).",
        "Fill in contact and status.",
        "Link payments to Budget when relevant.",
      ],
    },
    limitations: {
      ro: [
        "EasyWedd pentru cupluri nu este CRM pentru furnizori — acesta este EasyWedd Pro.",
        "Sincronizarea live cu EasyWedd Pro poate fi indisponibilă.",
      ],
      en: [
        "Couple EasyWedd is not a vendor CRM — that is EasyWedd Pro.",
        "Live sync with EasyWedd Pro may be unavailable.",
      ],
    },
  },
  {
    key: "timeline",
    route: "/dashboard/timeline",
    featureKey: "planner",
    keywords: {
      ro: ["timeline", "program", "orar", "ziua nunții", "programul evenimentului"],
      en: ["timeline", "schedule", "day of", "event schedule", "agenda"],
    },
    title: { ro: "Timeline", en: "Timeline" },
    description: {
      ro: "Programul evenimentului pe oră: pregătiri, ceremonie, restaurant, momente speciale.",
      en: "Hour-by-hour event schedule: getting ready, ceremony, reception, special moments.",
    },
    actions: {
      ro: ["Adaugă moment", "Setează ora", "Ordonează programul", "Notează furnizori implicați"],
      en: ["Add a moment", "Set the time", "Reorder the schedule", "Note involved vendors"],
    },
    steps: {
      ro: [
        "Deschide Timeline.",
        "Adaugă momentele zilei cu orele aferente.",
        "Ordonează lista ca să reflecte fluxul real.",
      ],
      en: [
        "Open Timeline.",
        "Add day-of moments with times.",
        "Reorder the list to match the real flow.",
      ],
    },
    limitations: {
      ro: ["Nu trimite automat programul către furnizori."],
      en: ["It does not automatically send the schedule to vendors."],
    },
  },
  {
    key: "contacts",
    route: "/dashboard/contacts",
    featureKey: "planner",
    keywords: {
      ro: ["contacte", "contact", "persoane", "telefon", "email"],
      en: ["contacts", "contact", "people", "phone", "email"],
    },
    title: { ro: "Contacte", en: "Contacts" },
    description: {
      ro: "Agendă de contacte utile pentru organizare (în afara listei de invitați).",
      en: "Useful contacts for planning (separate from the guest list).",
    },
    actions: {
      ro: ["Adaugă contact", "Editează contact", "Salvează telefon/email"],
      en: ["Add contact", "Edit contact", "Save phone/email"],
    },
    steps: {
      ro: [
        "Deschide Contacte.",
        "Adaugă persoane relevante (ex. martori, familie pentru coordonare).",
      ],
      en: [
        "Open Contacts.",
        "Add relevant people (e.g. witnesses, family coordinators).",
      ],
    },
    limitations: {
      ro: ["Invitații de nuntă se gestionează în Invitați, nu aici."],
      en: ["Wedding guests are managed under Guests, not here."],
    },
  },
  {
    key: "invitations",
    route: "/dashboard/invitations",
    featureKey: "invitations",
    keywords: {
      ro: ["invitație", "invitații", "digitală", "rsvp", "distribuire", "studio"],
      en: ["invitation", "invitations", "digital", "rsvp", "distribute", "studio"],
    },
    title: { ro: "Invitații", en: "Invitations" },
    description: {
      ro: "Invitation Studio: creează invitații digitale, preview, distribuire și urmărire RSVP/analytics.",
      en: "Invitation Studio: create digital invitations, preview, distribute, and track RSVP/analytics.",
    },
    actions: {
      ro: [
        "Creează invitație",
        "Editează design",
        "Preview",
        "Distribuie link",
        "Vezi analytics",
      ],
      en: [
        "Create invitation",
        "Edit design",
        "Preview",
        "Share link",
        "View analytics",
      ],
    },
    steps: {
      ro: [
        "Deschide Invitații.",
        "Creează un proiect nou dintr-un template.",
        "Editează conținutul și previzualizează.",
        "Distribuie linkul invitaților.",
        "Urmărește răspunsurile RSVP.",
      ],
      en: [
        "Open Invitations.",
        "Create a new project from a template.",
        "Edit content and preview.",
        "Share the link with guests.",
        "Track RSVP replies.",
      ],
    },
    limitations: {
      ro: ["Numărul de proiecte și branding-ul pot depinde de plan."],
      en: ["Project count and branding may depend on your plan."],
    },
  },
  {
    key: "website",
    route: "/dashboard/website",
    featureKey: "website",
    keywords: {
      ro: ["website", "site", "pagină nuntă", "publicare"],
      en: ["website", "site", "wedding page", "publish"],
    },
    title: { ro: "Website", en: "Website" },
    description: {
      ro: "Website de nuntă pentru invitați: informații esențiale, editare, preview și publicare.",
      en: "Wedding website for guests: essential info, editing, preview, and publishing.",
    },
    actions: {
      ro: ["Creează site", "Editează pagini", "Preview", "Publică", "Setări"],
      en: ["Create site", "Edit pages", "Preview", "Publish", "Settings"],
    },
    steps: {
      ro: [
        "Deschide Website.",
        "Creează un site nou.",
        "Editează paginile și previzualizează.",
        "Publică când ești mulțumit (dacă planul permite).",
      ],
      en: [
        "Open Website.",
        "Create a new site.",
        "Edit pages and preview.",
        "Publish when ready (if your plan allows).",
      ],
    },
    limitations: {
      ro: ["Publicarea poate necesita un plan care include website_publish."],
      en: ["Publishing may require a plan that includes website_publish."],
    },
  },
  {
    key: "billing",
    route: "/dashboard/billing",
    featureKey: null,
    keywords: {
      ro: ["abonament", "plată", "plan", "upgrade", "billing", "preț"],
      en: ["subscription", "payment", "plan", "upgrade", "billing", "price"],
    },
    title: { ro: "Abonament", en: "Billing" },
    description: {
      ro: "Gestionează planul EasyWedd, limitele și plățile Stripe.",
      en: "Manage your EasyWedd plan, limits, and Stripe payments.",
    },
    actions: {
      ro: ["Vezi planul curent", "Upgrade", "Deschide portalul de plată"],
      en: ["See current plan", "Upgrade", "Open payment portal"],
    },
    steps: {
      ro: [
        "Deschide Abonament.",
        "Compară planurile disponibile.",
        "Finalizează plata prin Stripe dacă alegi un upgrade.",
      ],
      en: [
        "Open Billing.",
        "Compare available plans.",
        "Complete payment via Stripe if you upgrade.",
      ],
    },
    limitations: {
      ro: ["EasyWedd Pro (pentru furnizori) are prețuri separate pe site-ul Pro."],
      en: ["EasyWedd Pro (for vendors) has separate pricing on the Pro site."],
    },
  },
  {
    key: "privacy",
    route: "/dashboard/privacy",
    featureKey: null,
    keywords: {
      ro: ["privacy", "confidențialitate", "gdpr", "date personale", "export"],
      en: ["privacy", "gdpr", "personal data", "export", "delete"],
    },
    title: { ro: "Privacy", en: "Privacy" },
    description: {
      ro: "Centrul de confidențialitate: consimțăminte și opțiuni legate de datele personale.",
      en: "Privacy center: consents and options related to personal data.",
    },
    actions: {
      ro: ["Revizuiește consimțămintele", "Gestionează preferințele de confidențialitate"],
      en: ["Review consents", "Manage privacy preferences"],
    },
    steps: {
      ro: ["Deschide Privacy din meniu și urmează opțiunile disponibile."],
      en: ["Open Privacy from the menu and follow the available options."],
    },
    limitations: {
      ro: ["Nu oferă consultanță juridică."],
      en: ["It does not provide legal advice."],
    },
  },
  {
    key: "settings",
    route: "/dashboard/settings",
    featureKey: null,
    keywords: {
      ro: ["setări", "profil", "limbă", "partener", "invită", "workspace", "fus orar"],
      en: ["settings", "profile", "language", "partner", "invite", "workspace", "timezone"],
    },
    title: { ro: "Setări", en: "Settings" },
    description: {
      ro: "Profil, limbă, fus orar, workspace și colaboratori (inclusiv invitarea partenerului).",
      en: "Profile, language, timezone, workspace, and collaborators (including inviting your partner).",
    },
    actions: {
      ro: ["Actualizează profilul", "Schimbă limba", "Invită partenerul", "Gestionează workspace"],
      en: ["Update profile", "Change language", "Invite partner", "Manage workspace"],
    },
    steps: {
      ro: [
        "Deschide Setări.",
        "Actualizează numele, limba sau fusul orar.",
        "Pentru a invita partenerul, folosește opțiunile de colaboratori/workspace din Setări.",
      ],
      en: [
        "Open Settings.",
        "Update your name, language, or timezone.",
        "To invite your partner, use collaborator/workspace options in Settings.",
      ],
    },
    limitations: {
      ro: ["Permisiunile diferă după rol (owner, partner, etc.)."],
      en: ["Permissions differ by role (owner, partner, etc.)."],
    },
  },
  {
    key: "rsvp",
    route: "/dashboard/guests",
    featureKey: "guests",
    keywords: {
      ro: ["rsvp", "răspuns", "confirmare", "vine", "nu vine"],
      en: ["rsvp", "reply", "confirmation", "attending", "not attending"],
    },
    title: { ro: "RSVP", en: "RSVP" },
    description: {
      ro: "Statusul de participare al invitaților. Poți seta RSVP manual în Invitați sau îl poți colecta prin invitația digitală.",
      en: "Guest attendance status. Set RSVP manually in Guests or collect it via digital invitations.",
    },
    actions: {
      ro: ["Setează RSVP pe invitat", "Colectează RSVP din invitație", "Filtrează după status"],
      en: ["Set RSVP on a guest", "Collect RSVP from invitation", "Filter by status"],
    },
    steps: {
      ro: [
        "Pentru actualizare manuală: Invitați → editează invitatul → status RSVP.",
        "Pentru colectare digitală: creează/distribuie o invitație din Invitații.",
      ],
      en: [
        "For manual updates: Guests → edit guest → RSVP status.",
        "For digital collection: create/share an invitation under Invitations.",
      ],
    },
    limitations: {
      ro: ["RSVP-ul public depinde de invitația/website-ul publicat."],
      en: ["Public RSVP depends on a published invitation/website."],
    },
  },
  {
    key: "documents",
    route: "/dashboard/vendors",
    featureKey: "vendors",
    keywords: {
      ro: [
        "documente",
        "contracte",
        "oferte",
        "facturi",
        "unde găsesc documentele",
        "atasamente furnizor",
        "fișiere furnizor",
        "URL document",
      ],
      en: [
        "documents",
        "contracts",
        "quotes",
        "invoices",
        "where are documents",
        "vendor attachments",
        "vendor files",
        "document URL",
      ],
    },
    title: { ro: "Documente", en: "Documents" },
    description: {
      ro: "Documentele (oferte, contracte, link-uri) se adaugă pe fiecare furnizor în Furnizori — nu există un drive general.",
      en: "Documents (quotes, contracts, links) are attached per vendor under Vendors — there is no general drive.",
    },
    actions: {
      ro: [
        "Deschide Furnizori",
        "Adaugă document (titlu + URL)",
        "Notează oferta/contractul la furnizor",
      ],
      en: [
        "Open Vendors",
        "Add a document (title + URL)",
        "Note quote/contract on the vendor",
      ],
    },
    steps: {
      ro: [
        "Deschide Furnizori.",
        "Selectează sau creează furnizorul.",
        "Folosește formularul „Adaugă document” cu titlu și URL.",
        "Completează și notele despre ofertă/contract.",
      ],
      en: [
        "Open Vendors.",
        "Select or create the vendor.",
        "Use “Add document” with a title and URL.",
        "Also fill quote/contract notes.",
      ],
    },
    limitations: {
      ro: [
        "Nu există un cloud drive general pentru orice tip de fișier.",
        "Documentele sunt legate de furnizori (vendor_documents).",
      ],
      en: [
        "There is no general cloud drive for arbitrary files.",
        "Documents are tied to vendors (vendor_documents).",
      ],
    },
  },
];

export function getKnowledgeByRoute(route: string): KnowledgeEntry | undefined {
  return EASYWEDD_KNOWLEDGE.find(
    (e) =>
      e.route === route &&
      e.key !== "rsvp" &&
      e.key !== "documents" &&
      e.key !== "calendar",
  );
}

export function getKnowledgeByKey(key: string): KnowledgeEntry | undefined {
  return EASYWEDD_KNOWLEDGE.find((e) => e.key === key);
}
