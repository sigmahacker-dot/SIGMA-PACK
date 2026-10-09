# Sigma Pack — Build Report

**Built:** 2026-10-09 ~11:20–11:35 PKT · **Stack:** Next.js 14 App Router + TypeScript + Tailwind CSS · **DB:** Neon Postgres (`@neondatabase/serverless`) · **Auth:** bcryptjs + jose JWT in httpOnly cookies
**Location:** `~/workspace/sigma-pack-app/` (spec untouched in `~/workspace/sigma-pack/`; travel-with-rawi untouched)

## File tree (key parts)

```
sigma-pack-app/
├── app/
│   ├── layout.tsx, globals.css            # navy #0A1830 / orange #FF6A00 theme
│   ├── page.tsx                           # landing (hero, stats, tools preview, plans, how-it-works, FAQ)
│   ├── tools/page.tsx                     # catalogue: search + category filter
│   ├── plans/page.tsx                     # plans → order or signup
│   ├── login/page.tsx  signup/page.tsx
│   ├── dashboard/page.tsx                 # buyer: subscription, my-tools + credential reveal, password change, WhatsApp
│   ├── orders/[id]/page.tsx               # manual payment (JazzCash/Easypaisa + WhatsApp screenshot link)
│   ├── admin/
│   │   ├── login/page.tsx  setup/page.tsx # setup = FIRST admin only, 404 afterwards
│   │   ├── layout.tsx                     # sidebar nav + mobile hamburger
│   │   ├── page.tsx                       # stats + pending orders + audit panels
│   │   └── orders/ buyers/ tools/ plans/ credentials/ settings/ audit/
│   └── api/                               # 34 routes (see below)
├── components/  Logo.tsx Navbar.tsx Footer.tsx ToolCard.tsx PlanCard.tsx types.ts
│   └── admin/ui.tsx  home/*
├── lib/
│   ├── db.ts        # neon() singleton + esc() helper
│   ├── auth.ts      # bcrypt hash/verify, jose JWT, httpOnly cookie helpers
│   ├── crypto.ts    # AES-256-GCM encrypt/decrypt (CREDENTIALS_KEY, 32-byte hex)
│   ├── validation.ts# strict input validators, slugify, in-memory rate limiter
│   ├── icons.ts     # ORIGINAL letter-mark SVG generator (no real product logos)
│   ├── audit.ts     # audit_log writer
│   └── guard.ts     # requireAdmin/requireBuyer/requireSession, reqUuid, parseBody
├── db/
│   ├── migrations/001_init.sql  # idempotent schema (all IF NOT EXISTS)
│   ├── tools.json               # 104 real AI tools, original descriptions
│   ├── seed.ts                  # idempotent: 3 plans + tool upserts
│   └── README.md
├── middleware.ts                # /dashboard* + /admin* route protection
├── .env.example                 # DATABASE_URL, JWT_SECRET, CREDENTIALS_KEY (no real values)
└── tailwind.config.ts           # navy + brand color tokens
```

## API routes (34)

- Public: `GET /api/stats`, `/api/tools`, `/api/plans`, `/api/settings/public`
- Buyer: `POST /api/auth/signup|login|logout`, `GET /api/auth/me`, `POST /api/auth/change-password`, `GET /api/subscription`, `POST|GET /api/orders`, `GET /api/orders/[id]`, `GET /api/my-tools`, `POST /api/credentials/reveal`
- Admin: `GET /api/admin/setup/status`, `POST /api/admin/setup` (404 after first admin), `POST /api/admin/login` (username OR email), `GET /api/admin/stats`, tools CRUD, plans CRUD, buyers list + `POST /api/admin/buyers/[id]/reset-password`, orders list + `PATCH /api/admin/orders/[id]` (pending→active sets `expires_at = now + months`), credentials CRUD (AES-256-GCM), settings GET/PUT, account PUT, audit GET

## Run instructions

1. `cd ~/workspace/sigma-pack-app && npm install`
2. Neon: create free project → run `db/migrations/001_init.sql` in Neon SQL editor (or psql).
3. `cp .env.example .env.local` and fill: `DATABASE_URL` (pooled Neon string), `JWT_SECRET` (≥32 chars, `openssl rand -hex 32`), `CREDENTIALS_KEY` (64 hex chars, `openssl rand -hex 32`).
4. `DATABASE_URL=... node db/seed.ts` → seeds 3 plans + 104 tools (idempotent).
5. `npm run dev` → open `/admin/setup` to create the first admin (route 404s afterwards).

## Seed admin flow

Visit `/admin/setup` → set username/email/password → redirected to `/admin/login` → sign in. Change payment numbers + WhatsApp in **Settings** before sharing the site.

## Verification evidence (2026-10-09)

- `npm run build` ✅ zero errors (fixed: non-route export in plans route; moved `parseFeatures` → shared `reqStringArray` in lib/validation)
- `npx tsc --noEmit` ✅ clean
- `next start` + curl: `/ /tools /plans /login /signup /admin/login /admin/setup` → 200; `/dashboard /admin /admin/orders` → 307 → login (unauthenticated) ✅
- API without DB → clean `{"error":"Something went wrong."}` 500s, no stack leaks ✅
- Security review: bcrypt-only hashes; JWT httpOnly+Secure+SameSite cookies; guards on every protected API route; middleware on pages; login rate limits (10/10min); setup 404s after first admin; AES-256-GCM for credentials; no plaintext passwords/secrets in code or logs; `.env.example` only (no `.env.local` committed) ✅

## Known limitations / pending on user

1. **Neon DATABASE_URL not yet created** (user-side, ~2 min signup) — APIs 500 until configured; seed not yet executed against live DB.
2. **Not git-initialized / not pushed** — parent handles repo + Vercel deploy. When committing: use repo identity `sigmahacker-dot <rawihub91@gmail.com>` (Vercel Hobby blocks unknown-author deploys).
3. **Hosting:** user chose Vercel Hobby and accepted the commercial-use/ToS risk (per MEMORY.md 2026-10-09) — do NOT re-ask.
4. Payment flow is manual v1 (JazzCash/Easypaisa numbers + WhatsApp screenshot); no gateway.
5. Tool credential reveal requires an active subscription; credentials are assigned per-buyer by admin.
6. `db/seed.ts` is excluded from tsconfig (standalone Node-24 type-stripping script; validated via `node --check` + runtime error-path test).
