# Art by Vero Miller

Independent TanStack Start rewrite of the Art by Vero Miller portfolio.

## Requirements

- Node.js 22
- npm
- A non-production Supabase PostgreSQL project or branch

Never use the production database for development, tests, or preview deployments.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to the non-production Supabase transaction pooler.
3. Set `DIRECT_URL` to its direct connection or session pooler.
4. Generate a unique `SESSION_SECRET`.
5. Apply and seed the database:

```bash
npm install
npm run db:migrate
npm run db:seed
```

The seed creates portfolio fixtures and either uses `SEED_ADMIN_PASSWORD` or
prints a newly generated non-production password.

## Development

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Verification

```bash
npm run validate
```

The validation pipeline checks formatting, linting, TypeScript, unit tests, and
the production build. Database integration and browser tests must target the
isolated non-production Supabase environment.

## Deployment

The application uses standard TanStack Start server functions and Web APIs; it
does not import Vercel-specific application APIs. Configure the same validated
environment variables in a separate preview project before connecting any
production domain.
