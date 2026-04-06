# Mobile app ↔ Supabase (VEERA)

## Error: `Could not find the table 'public.user_plants' in the schema cache`

PostgREST returns this when **`public.user_plants` does not exist** on the Supabase project your app uses (or the schema cache is stale after DDL—rare).

The mobile client queries `user_plants` by design (`mobile/lib/api/plants.ts`). There is no mock that hides a missing table.

---

## 1. Confirm which project the app uses

The app reads **`EXPO_PUBLIC_SUPABASE_URL`** from `mobile/.env` at build/bundle time.

- Open **Supabase Dashboard → Project Settings → API**.
- Compare **Project URL** with the host in `EXPO_PUBLIC_SUPABASE_URL` (same origin = same project).
- The **project ref** is the subdomain before `.supabase.co` (e.g. `https://<ref>.supabase.co`).

If Dashboard shows a different URL than `.env`, update `.env`, restart Metro with cache clear (`npx expo start -c`), and rebuild dev clients if needed.

---

## 2. What must exist for the home screen

Home loads **recent user plants** from **`public.user_plants`** (and related joins to **`public.plants`** for names/images). Minimum:

| Object | Purpose |
|--------|---------|
| `public.user_plants` | Row per plant the user added |
| `public.user_plant_progress` | Optional for some flows; created in same migration |
| `public.plants` | Catalog (from `Reference/schema.sql`) |
| RLS policies on catalog + user tables | So authenticated users can read/write per migration |

RPC **`public.resolve_plant_qr`** is used by Scan / deep links; it is in the **mobile migration**, not in `Reference/schema.sql` alone.

---

## 3. SQL to apply (if `user_plants` is missing)

**Order:**

1. Apply **`Reference/schema.sql`** (catalog, admin roles, etc.) if not already applied.
2. Apply the full file:
   - **`supabase/migrations/20250325000000_mobile_app_rls_and_user_tables.sql`**

Run both in the **same** Supabase project as `EXPO_PUBLIC_SUPABASE_URL`.

If a statement fails (e.g. object already exists), fix the specific error; the migration uses idempotent patterns where possible but assumes catalog tables from `schema.sql` exist.

---

## 4. Verify in SQL Editor

```sql
select to_regclass('public.user_plants') as user_plants;
select to_regclass('public.user_plant_progress') as user_plant_progress;
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'resolve_plant_qr';
```

Expected: `user_plants` and `user_plant_progress` are non-null; `resolve_plant_qr` appears in the third query.

---

## 5. Schema cache / restart

After successful `create table`, PostgREST usually exposes the table within seconds. If the app still shows the schema-cache error:

- Wait a minute and retry the app.
- In **Dashboard → Project Settings**, pause and resume the project (or contact Supabase if it persists)—this reloads the API layer.

No UI workaround is required once the table exists on the correct project.
