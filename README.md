# RentHub — Rental Marketplace & Management Platform

RentHub connects **Landlords → Rent Agents → Properties → Tenants** in Kenya. It is a full production-style application with authentication, role-based access control (tenant / rent agent / landlord / admin), a public property marketplace, viewings, applications, leases, rent tracking, payments, receipts, commissions, messaging, notifications and a full admin panel.

**Currency:** KES · **Market:** Kenya · **Timezone:** Africa/Nairobi

> Branding, currency, contact details, fees and feature flags are configurable centrally — either in [`lib/constants.ts`](lib/constants.ts) (defaults) or in the database `platform_settings` table (admin → Settings).

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **React 18** + **Tailwind CSS 3** + hand-rolled shadcn-style UI kit + **Lucide** icons
- **Neon Postgres** — serverless PostgreSQL via the `postgres` (postgres.js) driver
- **Better Auth** — email/password auth, email verification, password reset, admin plugin
- **Zod** + **React Hook Form** — validated forms everywhere
- **Server Actions** + **Route Handlers** for mutations and webhooks
- **Recharts** — admin analytics
- **Vercel Blob** (optional) — file storage in production; local `/public/uploads` in dev

> No Supabase. Database access is raw SQL with app-layer authorization (no RLS) — every mutation re-checks roles and ownership server-side. Messaging uses lightweight polling instead of realtime channels.

## Project structure

```
app/
  (public)/          # homepage, /properties, /agents, about/contact/legal
  (auth)/            # /login, /signup, /forgot-password, /reset-password, onboarding
  dashboard/         # /dashboard/{tenant,agent,landlord}/…
  admin/             # /admin — separate admin dashboard
  api/               # auth (Better Auth), uploads, webhooks, bootstrap, demo seed, cron
components/
  ui/ properties/ forms/ dashboard/ messaging/ payments/
lib/
  auth/              # Better Auth instance, client, helpers, middleware
  db/                # postgres client + SQL query helpers
  payments/ validations/ permissions/ notifications/ storage/
db/
  migrations/        # 000001_auth_tables, 000002_app_tables, 000003_seed
types/
scripts/             # create-admin.mjs, seed-demo.mjs
```

## Installation

```bash
git clone <repo> renthub && cd renthub
npm install
cp .env.example .env.local   # then fill in values
npm run db:migrate           # creates schema + seed data on Neon
npm run dev                  # http://localhost:3000
```

Requires Node 18.17+ (recommended 20+).

## Environment variables

See [.env.example](.env.example). The critical ones:

| Variable | Purpose | Exposure |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | **server-only** |
| `BETTER_AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) | **server-only** |
| `BETTER_AUTH_URL` | Public app URL used by auth emails/cookies | server |
| `NEXT_PUBLIC_APP_URL` | Emails, SEO canonical, redirects | public |
| `STORAGE_PROVIDER` / `BLOB_READ_WRITE_TOKEN` | `local` (dev) or Vercel Blob (prod) | token **server-only** |
| `PAYMENT_PROVIDER` / `PAYMENT_SECRET_KEY` / `PAYMENT_WEBHOOK_SECRET` | `mock` (dev) or `paystack` | **server-only** |
| `BOOTSTRAP_SECRET` | One-time admin creation | **server-only** |
| `MAPS_API_KEY` / `EMAIL_API_KEY` / `CRON_SECRET` | Optional integrations | server |

Never prefix server secrets with `NEXT_PUBLIC_` and never commit `.env.local`.

## Neon setup

1. Create a project at [neon.tech](https://neon.tech) (or use any Postgres 14+).
2. Copy the pooled or direct connection string into `DATABASE_URL`.
3. Run the migrations:
   ```bash
   npm run db:migrate
   ```
   `db/migrate.mjs` applies `db/migrations/*.sql` in order and records them in `_migrations`. It creates Better Auth tables (`user`, `session`, `account`, `verification`), all application tables (profiles → platform_settings) with indexes and constraints, plus seed data (property types, amenities, locations, settings, roles).

## Authentication setup (Better Auth)

- Email/password signup with **email verification** (optional — `AUTH_REQUIRE_EMAIL_VERIFICATION`) and **role selection** (Tenant / Rent Agent / Landlord — admin is never selectable publicly).
- Verification + password-reset emails go through `lib/email.ts` (console logger in dev; wire any provider with `EMAIL_API_KEY`).
- Session cookie handled by Better Auth; middleware gates `/dashboard` and `/admin`; each layout/action re-checks the role server-side.
- OAuth providers can be added later in `lib/auth.ts` without UI changes.

### Admin account setup (one-time)

```bash
# 1) Start the app, then:
APP_URL=http://localhost:3000 BOOTSTRAP_SECRET=your-secret node scripts/create-admin.mjs \
  --email admin@renthub.co.ke --password 'STRONG_PASSWORD' --name "RentHub Admin"
```
This calls `/api/admin/bootstrap`, which refuses to run if an admin already exists. Admin roles can **only** be created this way.

### Demo data (development only)

```bash
APP_URL=http://localhost:3000 node scripts/seed-demo.mjs
```
Creates clearly-labelled demo users (fixed passwords — do **not** use in production):

- `tenant@demo.renthub.co.ke` / `RentHubDemo2026!`
- `agent@demo.renthub.co.ke` / `RentHubDemo2026!`
- `landlord@demo.renthub.co.ke` / `RentHubDemo2026!`

…plus six sample properties with placeholder photos, a demo lease and a pending rent record.

## Payment setup

The app uses a provider abstraction (`lib/payments/`). Two providers ship:

- **`mock`** (default, no keys): the checkout redirects to `/api/payments/mock-complete`, which runs the *same success path a real webhook triggers* — great for local development.
- **`paystack`**: set `PAYMENT_PROVIDER=paystack` and the secret keys. Amounts are sent in minor units (×100). Configure the webhook in your Paystack dashboard:
  - URL: `https://your-domain/api/webhooks/payments`
  - Event: `charge.success`

The webhook verifies the **HMAC-SHA512 signature** over the raw body (`x-paystack-signature`), is idempotent per reference, and updates payments server-side — never from client-side state.

## Local development

```bash
npm run dev
```
With `PAYMENT_PROVIDER=mock`, the full flow works end-to-end locally: search → favorite → book viewing → apply → (agent approves) → create lease → pay rent → receipt. Uploaded images land in `public/uploads` (add it to `.gitignore` if you commit).

## Production deployment (Vercel)

1. Push to GitHub and import into Vercel.
2. Add all environment variables from `.env.example` (never `NEXT_PUBLIC_`-prefix server secrets).
3. Set `STORAGE_PROVIDER=vercel-blob` + `BLOB_READ_WRITE_TOKEN`, `PAYMENT_PROVIDER=paystack` (if live).
4. Deploy. Run `npm run db:migrate` against your Neon database from CI or locally first.
5. Optional: Vercel Cron → `/api/cron/rent-overdue` with a `CRON_SECRET` header to mark overdue rent daily.
6. Note: the local-filesystem upload path does **not** work on Vercel (read-only FS) — use Vercel Blob there.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `DATABASE_URL is not set` | Add your Neon connection string to `.env.local` |
| Migrations fail | Confirm the DB is reachable (`ssl` is included in the Neon URL) and rerun `npm run db:migrate` |
| Login says "Invalid email or password" | Check `BETTER_AUTH_SECRET` is set; if `AUTH_REQUIRE_EMAIL_VERIFICATION=true`, verify the email first |
| Reset/verification emails not arriving | Check the email provider (dev logs to the console) and `BETTER_AUTH_URL` |
| Uploads 404 on Vercel | `public/uploads` is local-only — switch to `BLOB_READ_WRITE_TOKEN` |
| Webhook returns 401 | Check `PAYMENT_WEBHOOK_SECRET` matches the Paystack dashboard secret |
| `Error: an admin already exists` (bootstrap) | The bootstrap endpoint is one-time only by design |

## Security notes

- Authorization is enforced in the application layer on every action (roles + ownership checks); there is no RLS in Neon.
- Better Auth handles password hashing (scrypt) and session management; sessions are 7-day with sliding renewal.
- All forms validated with Zod; server actions re-validate input.
- Destructive actions use confirmation dialogs; sensitive admin actions are written to `audit_logs`.
- Public pages never expose private tenant information.

## Legal

Terms of Service, Privacy Policy and the Rental Safety guide are placeholders (`/terms`, `/privacy`, `/safety`) — have them reviewed by a lawyer before launch.

---

Made for Kenya 🇰🇪 · KES · Africa/Nairobi
