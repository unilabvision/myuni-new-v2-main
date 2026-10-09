# Media architecture

## Implemented baseline

The application now has one controlled ingestion path for dashboard images:

```text
Dashboard
  -> POST /api/admin/media
  -> validate type and 4 MB limit
  -> resize to at most 2560 px
  -> encode WebP
  -> create 320/640/960/1280/1920/2560 variants
  -> hash optimized content
  -> store immutable objects in Supabase Storage
  -> return the canonical original.webp URL
```

The content hash is the object identity. Uploading the same optimized image again reuses the existing objects without regenerating or re-uploading its variants. Public pages select a pre-generated width through the Next.js image loader and serve it directly from Supabase Storage CDN; no image transformation or byte proxy runs on Vercel during page views.

Dashboard upload contract:

```http
POST /api/admin/media
Content-Type: multipart/form-data

file=<JPEG|PNG|WebP|AVIF>
folder=courses/banner
```

The caller stores the returned `url` in the content record. `ADMIN_EMAILS`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `MEDIA_STORAGE_BUCKET` must be configured.

Run a read-only maintenance audit with:

```bash
npm run media:audit -- --summary
npm run media:audit
```

The detailed command reports exact duplicate groups and unreferenced candidates. It never deletes objects. An unreferenced candidate must be checked against rich text and external systems before deletion.

## Target architecture

```text
                    control plane
Dashboard -> Media API -> media_assets registry -> content record
                  |
                  v
             optimizer worker
                  |
                  v
             object storage  -> CDN -> Web application
                    data plane
```

Rules:

- All dashboard uploads pass through one Media API.
- Content records reference a media asset, not arbitrary storage URLs.
- Object names are immutable content hashes.
- Optimization happens once at ingestion, never on every page request.
- The storage CDN serves objects directly; the application is not a permanent byte proxy.
- Replacing an image updates the reference. It does not overwrite an immutable object.
- A scheduled retention job marks unreferenced assets, waits through a grace period, then deletes only approved assets.

## Architecture options

### A. Supabase Storage + centralized ingestion

Keep the implemented upload API and Supabase Storage. Use pre-generated variants and immutable caching. Public delivery goes directly to the storage CDN.

- Lowest migration effort.
- Existing database and permissions stay in place.
- Supabase Cached Egress remains the main scaling constraint.
- `/api/media` remains only for backward compatibility; new image URLs do not use it.

Best for the immediate stabilization phase.

### B. S3-compatible object storage + CDN

Use Cloudflare R2, AWS S3, Backblaze B2, or an equivalent object store behind a CDN. Keep the same Media API contract.

- Separates application compute from media delivery.
- Supports lifecycle rules, custom domains, immutable caching, and cheaper high-volume delivery.
- Requires bucket policies, CDN configuration, migration, and observability.

Best balance for this system after stabilization. The application database stores only asset IDs and metadata.

### C. Managed image platform

Use Cloudinary, Imgix, Cloudflare Images, or a similar service for upload, transformation, format negotiation, and CDN delivery.

- Lowest operational burden and automatic AVIF/WebP negotiation.
- Strong dashboard workflows and transformation APIs.
- Higher vendor dependency and potentially higher predictable monthly cost.

Best when engineering time is more expensive than media delivery fees.

### D. Event-driven media pipeline

Dashboard uploads the source directly with a signed URL. An object-created event sends a job to a queue; a worker generates variants and updates the media registry.

- Uploads do not consume application function request limits.
- Retries, antivirus scanning, metadata extraction, and large media are easier to manage.
- More components and operational complexity.

Best when upload volume, file size, or multiple consuming applications justify a dedicated media service.

## Recommended migration

1. Route every new dashboard image through `/api/admin/media`.
2. Stop generating timestamp-based image names.
3. Keep existing URLs working while new uploads use hash-based variants.
4. Review the audit report and clean confirmed duplicates first.
5. Introduce a `media_assets` registry with owner, checksum, status, created date, and last-reference date.
6. Move delivery to an object-storage CDN custom domain.
7. Retire `/api/media` after old proxied URLs have aged out of caches.
8. Enable a weekly audit and a 30-day soft-delete retention policy.
