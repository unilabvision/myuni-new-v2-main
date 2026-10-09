# Supabase egress optimization

## Runtime behavior

- Public courses, packages, ratings, events, campaigns, and testimonials use the Next.js Data Cache for 10 minutes.
- Successful public responses include `s-maxage=600` and `stale-while-revalidate=86400`.
- Progress and enrollment responses remain private and are never placed in the shared cache.
- Notes progress is persisted once per minute while active instead of every 5 seconds.
- Private lesson and form-resource signed URLs live for 60 minutes and are reused for 55 minutes.
- Progress writes return only the fields consumed by the application.

Apply the additive database migration before deploying the application:

```text
supabase/migrations/202610090001_optimize_public_catalog.sql
```

It adds a database-side course rating aggregate, a single-row public campaign query, and supporting indexes. It does not delete or rewrite application data.

## Dashboard cache invalidation

Set a long random `CACHE_REVALIDATION_SECRET` in both the website and dashboard environments. After a successful dashboard mutation, call:

```http
POST https://myunilab.net/api/admin/cache/revalidate
Content-Type: application/json
X-Cache-Revalidation-Secret: <CACHE_REVALIDATION_SECRET>

{"resources":["courses","events","packages","campaigns","courseRatings"]}
```

Send only the resources changed by the mutation. Valid resource names are:

- `courses`
- `events`
- `packages`
- `campaigns`
- `courseRatings`

The local discount-code and course-comment APIs already invalidate their related cache tags automatically.

## Storage egress measurement

Open Supabase Dashboard, then Logs > Explorer > Run SQL. Select `Logs` as the query source and start with a one-hour time range. Run the queries in:

```text
docs/supabase-egress-observability.sql
```

The report shows the most requested objects, the largest cache-miss candidates by request count, and hourly cache-hit ratio. Multiply an object's request count by its Storage metadata size to estimate its contribution to egress.

The existing read-only inventory remains available through:

```bash
npm run media:audit -- --summary
```
