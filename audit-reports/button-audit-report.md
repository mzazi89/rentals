# RentHub — Clickable UI Audit Report

**Date:** 2026-08-30 · **Target:** https://kenyarentals.vercel.app (commit `c7055bc` → `900182b`) · **Method:** static route/handler scan + live HTTP-level click-through (browser relay unavailable, so interactive verification was done via authenticated cookie sessions + rendered-page inspection)

## 1. Static audit

| Check | Result |
|---|---|
| Routes enumerated (`app/**/page.tsx|route.ts`) | 76 |
| `href` / `router.push` / `redirect` targets scanned | 102 |
| Broken static links | 0 |
| Unresolved dynamic (template-literal) links | 0 (last candidate `/dashboard/${role}/notifications` valid for all 3 roles) |
| Buttons without `onClick`/`type=submit`/`form` | 1 — the base `Button` primitive (`components/ui/core.tsx:45`), which spreads `{...props}`; expected |
| Sidebar nav links vs existing routes | All match (tenant 8, agent 10, landlord 8, admin 14) |
| Forms without action/onSubmit | 0 (search form uses `onSubmit` → `router.push`) |
| Server actions referenced by client buttons | All exist and are wired (delete/deactivate property, verify landlord, wizard, units, messaging, favorites, payments) |

## 2. Live verification (production)

### Public
- `/`, `/properties`, `/agents`, `/login`, `/signup`, `/signup/role`, `/forgot-password`, `/reset-password`, `/about`, `/contact`, `/terms`, `/privacy`, `/safety` — **200**
- `/dashboard`, `/admin` signed out — **307 → /login?next=…** (auth gate works)
- Search: `?location=Kilimani`, `?minRent`, `?maxRent`, `?bedrooms=2`, `?furnished=true`, valid `?type=<uuid>` — **200**
- Property detail page renders with CTAs: **Book viewing / Apply / Contact / Report** all present
- Agent directory → agent profile (`/agents/4PW0Y…`) — **200**, contact/message CTAs present
- Unknown URL → branded **404**

### Auth
- Owner login (`admin@kenyarentals.com`) — **200 + session cookie**; `/admin` **200**; `/dashboard` → **307 to /admin** (owner routing correct)
- Demo tenant/agent/landlord logins — **200**; `/dashboard` → correct role dashboard each
- Signup endpoint (`POST /api/auth/sign-up/email`, throwaway account) — **200 + session cookie** (throwaway cleaned up after test)
- Forgot-password page renders; reset flow wired

### Dashboards (all pages 200 with role session)
- Tenant: overview, viewings, applications, saved, lease, payments, messages, notifications, settings — **all 200**
- Agent: overview, properties, tenants, applications, viewings, payments, commissions, messages, reports, profile, settings, `properties/new` (wizard), `properties/[id]/edit`, `properties/[id]/units` — **all 200**
- Landlord: overview, properties, agents, tenants, applications, payments, reports, settings, `properties/[id]/structure` (Add floor / Add unit buttons rendered) — **all 200**
- Admin (owner): overview, agents, applications, audit-logs, commissions, flags, landlords, payments, properties, reports, reviews, settings, tenants, users, viewings — **all 14 → 200**

### Feature pipelines
- **Landlord verification gating** — verified end-to-end: demo landlord `pending` → his 6 buildings **hidden** from public `/properties`; after owner approval (status → `verified`, same SQL as the Approve button) → buildings **visible** in public browse. Admin landlord page renders pending card with Approve button + Pending badge.
- **Demo seed** — repaired (see findings), now returns `ok:true`, idempotent.
- Reports CSV — client-side Blob download with disabled state when empty (code-verified).
- Receipt print — `window.print()` button (code-verified; no payment rows existed for a live receipt render).
- Notifications bell, chat send, favorites, wizard steps, unit status toggles — client components with verified handlers; pages render without server errors.

## 3. Findings & fixes (commit `900182b`, deployed)

1. **BUG (fixed): 500 on malformed search filters.** `/properties?type=apartment` (non-UUID value) crashed with `invalid input syntax for type uuid` because `fetchPublicProperties` bound the raw value against a `uuid` column. Fix: type and amenity filters now validate UUID shape and are ignored when malformed → graceful 200. Same crash path existed for `?amenities=`.
2. **BUG (fixed): demo seed crashed with FK violation.** `ensureUser` created auth users via `auth.api.signUpEmail` but never inserted `profiles` rows; on a partial/orphan state (`user` row exists, profile missing) the seed died on `agents` FK. Fix: reuse the existing auth user and insert the missing profile (idempotent). The 3 orphan demo profiles on Neon were repaired so the deployed seed succeeded.

## 4. Verification pipeline

- `npx tsc --noEmit` — **0 errors**
- `npx next lint` — **0 warnings/errors**
- `next build` (with `NEXT_PUBLIC_APP_URL` empty) — **passes**
- Commit `900182b` pushed to `github.com/mzazi89/rentals` → Vercel redeployed; previously-crashing filter now returns 200, seed returns `ok:true`, home/properties 200.

## 5. Not tested live (N/A)

- Receipt print (no payment rows in demo data) — code-verified only
- Physical click feel of client-only interactions (dropdown menus, modals, toasts) — handler wiring verified statically; pages render without errors
