# Architecture Overview

> Updated: 2026-11-16. Stack: Laravel 11/12 package, Inertia, React, Tiptap 2.

## Layer Topology

- `src/Http/Controllers`: public and administrative HTTP endpoints.
- `src/Models`: Eloquent blog models.
- `src/Support`: Markdown rendering.
- `resources/js/Pages`: publishable React pages and editor components.
- `routes`: routes registered by `BlogServiceProvider`.
- `database/migrations`: publishable schema migrations.
- `tests`: package-level PHP and editor tests.

## Domain Map

| Domain | Pattern | Notes |
|--------|---------|-------|
| Posts | Eloquent CRUD | Markdown source and rendered HTML stored together |
| Media | Validated upload | Configured Laravel filesystem disk |
| Tags / comments | Package integrations | Optional, controlled by configuration |
| Analytics | Controllers + query builder | Optional view and link-click tracking |

## Key Decisions

- This is a package, not a standalone Laravel or Vite application. Pages are published into a host app.
- HTML/SVG previews use explicitly marked Markdown code fences, sandboxed iframes and restrictive CSP. Ordinary raw HTML remains stripped.
- No CQRS, event sourcing or frontend FSD layers.",