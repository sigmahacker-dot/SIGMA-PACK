# Database — migrations & seed

The app uses Neon Postgres. Schema lives in SQL migrations, seed data in TypeScript.

## Migration order

Run the migrations **in numeric order** against your Neon database before seeding:

1. `db/migrations/001_init.sql` — creates all tables (`admins`, `buyers`, `plans`,
   `tools`, `orders`, `tool_credentials`, `settings`, `audit_log`), enables `pgcrypto`,
   and inserts the default `settings` row (id = 1).

You can apply it from the Neon SQL editor (paste the file contents) or with `psql`:

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
```

Migration 001 is idempotent (`CREATE TABLE IF NOT EXISTS`), so re-running it is safe.

## Seeding

From the project root (`~/workspace/sigma-pack-app/`):

```bash
DATABASE_URL=postgresql://user:pass@host/dbname node db/seed.ts
```

The script is idempotent — safe to re-run any time:

- **Plans** are upserted by `slug` (`ON CONFLICT (slug) DO UPDATE`):
  - `monthly` — Monthly, 1 month, **Rs 799**
  - `half-yearly` — Half-Yearly, 6 months, **Rs 3999**
  - `yearly` — Yearly, 12 months, **Rs 6999**
- **Tools** are upserted by `slug` (`ON CONFLICT (slug) DO UPDATE`).
  The tool list comes from `db/tools.json` (~100 real AI tools across 12 categories).
  Each run re-reads the JSON, so editing `tools.json` and re-running updates the rows.

`node` runs the TypeScript seed directly via type stripping (no build step needed).
Keep `db/seed.ts` free of enums/namespaces so stripping keeps working.

The script exits with a clear error if `DATABASE_URL` is not set, and prints the
final `plans` / `tools` row counts when it finishes.

## Icons

Every tool's `icon_svg` is generated at seed time by `letterIcon(name)` from
`lib/icons.ts` — a deterministic, original letter-mark (colored rounded square +
initials). Real product logos are never copied or stored. If you rename a tool,
re-run the seed and its icon regenerates.

## Adding a new migration

Create `db/migrations/002_<name>.sql` (next number), keep it idempotent
(`IF NOT EXISTS` / `ON CONFLICT`), and apply it before re-running the seed.
