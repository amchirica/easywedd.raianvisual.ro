# EasyWedd

Platformă SaaS pentru organizarea nunții — oferită inițial clienților Raian Fine Arts, apoi ca produs independent.

**Domeniu:** [easywedd.raianvisual.ro](https://easywedd.raianvisual.ro)

## Etapa 1 — Fundație

Această etapă livrează:

- Next.js App Router + TypeScript strict + Tailwind + shadcn/ui
- Multi-tenancy (`workspaces`, `workspace_members`)
- Auth Supabase (register, login, logout, reset password, email verify callback)
- Onboarding + invitație partener
- Schema PostgreSQL + RLS
- Dashboard shell cu empty states reale
- Admin shell (acces via workspace `admin`)
- Stripe & Resend pregătite, fără plăți / emailuri obligatorii

## Etapa 2 — Wedding Planner

Implementat:

- Task management (listă / kanban / calendar, checklist, recurență, template)
- Budget planner (categorii, plăți, curs EUR/RON manual, export CSV / print)
- Guest management (CSV, RSVP tokenizat, duplicate, anonimizare)
- Seating plan (mese + asignări, fără editor CAD)
- Vendor CRM, timeline zi, agenda contacte
- Dashboard analytics reale

Invitation Studio și Website Builder rămân pentru etape viitoare.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, PostgreSQL, RLS, Storage ready)
- Zod + React Hook Form ready
- Stripe / Resend stubs

## Setup local

### Cerințe

- Node.js 20+
- Cont Supabase

### Pași

```bash
npm install
cp .env.example .env.local
# completează variabilele — vezi docs/ENV.md
```

Aplică migrațiile SQL din `supabase/migrations/` în ordinea numelui, în Supabase SQL Editor (sau CLI `supabase db push`).

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

### Scripturi

| Script | Descriere |
|--------|-----------|
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test` | Vitest (calcule buget + acces) |
| `npm run build` | Next.js production build (local / non-CF) |
| `npm run cf:build` | OpenNext Cloudflare build (`.open-next/`) — **obligatoriu în CI Cloudflare** |
| `npm run deploy` | `cf:build` + deploy Cloudflare |
| `npm run start` | Start build-ul de producție |
| `npm run seed:dev` | Reminder: aplică `supabase/seed.dev.sql` doar în DEV |

Deploy Cloudflare: vezi [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md). Build command în Dashboard trebuie să fie `npm run cf:build`, nu `npm run build`.

## Auth & onboarding

1. `/register` — cont + consimțăminte terms/privacy
2. Verificare email (Confirm email ON) via `/auth/confirm?token_hash=…` (`verifyOtp`)
3. `/dashboard/onboarding` — tip workspace, detalii nuntă, invitație partener
4. `/dashboard` — analytics reale (task-uri, RSVP, buget, furnizori)
5. RSVP public: `/rsvp/[token]` (token hashed, one-shot)

## Admin

Accesul `/admin/*` necesită `public.is_platform_admin()` = true:
membership `accepted` cu rol `admin` **sau** `owner` pe un workspace
`workspace_type = 'admin'` și `status = 'active'` (sau `owner_id` pe acel workspace).

Creează manual în SQL (după ce ai un user) — folosește **UUID-ul contului
cu care te autentifici**, nu un alt user:

```sql
insert into public.workspaces (name, slug, workspace_type, owner_id, status)
values ('EasyWedd Admin', 'easywedd-admin', 'admin', '<USER_UUID>', 'active');

insert into public.workspace_members (workspace_id, user_id, role, invitation_status)
values ('<WORKSPACE_UUID>', '<USER_UUID>', 'admin', 'accepted');
```

## Deployment (Vercel)

1. Importă repo-ul în Vercel
2. Setează variabilele din `.env.example`
3. Domain: `easywedd.raianvisual.ro`
4. Asigură-te că migrațiile sunt aplicate pe proiectul Supabase de producție
5. Adaugă URL-ul de producție în Supabase Auth Redirect URLs

Cloudflare Pages/Workers rămâne o alternativă ulterioară; App Router + Vercel este ținta etapei 1.

## Structură

```
app/                 # rute marketing, auth, dashboard, admin
components/          # UI, marketing, dashboard, auth, onboarding
lib/                 # supabase, actions, validations, stripe, resend
supabase/migrations/ # schema + RLS
types/               # Database types
docs/                # documentație env
```

## Confidențialitate

- Consimțământ separat pentru `anonymized_industry_research`
- Fără politici publice pe date de invitați (tabelul nu există încă)
- Site-urile publice de nuntă vor folosi RPC/views controlate în etape viitoare
