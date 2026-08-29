# PickSix

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpavan%2Fpicksix)

A mobile-first private World Cup prediction league built with Next.js 15, TypeScript, Tailwind, Prisma/PostgreSQL and Auth.js-ready models.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The interface includes a browser-persisted demo mode so the full create → invite → predict experience works before a database is connected. Production API routes use Prisma and PostgreSQL.

## Supabase + Vercel deployment

1. Create a Supabase project and copy its pooled PostgreSQL URL to `DATABASE_URL` and direct URL to `DIRECT_URL`.
2. Generate `AUTH_SECRET` with `openssl rand -base64 32`. Add Google OAuth credentials if used.
3. Run `npx prisma migrate dev --name init`, then `npx prisma generate`.
4. Push to GitHub and import the repository in Vercel.
5. Add every value from `.env.example` in Vercel Project Settings → Environment Variables.
6. Set `NEXT_PUBLIC_APP_URL` to the deployed domain and deploy.

## Production checklist

- Replace demo fixtures in `lib/data.ts` with the verified official tournament feed before kickoff.
- Protect API mutations with an Auth.js session and league membership check.
- Schedule kickoff locking and result settlement with Vercel Cron.
- Configure transactional email and Web Push credentials.
- Enable Supabase point-in-time recovery, connection pooling, and Row Level Security.
- Add rate limits to auth, league join, and prediction endpoints.
- Configure custom domain, privacy policy, terms, error monitoring, and analytics.

## Scoring

`lib/scoring.ts` implements the supplied exclusive head-to-head hierarchy: unique exact score (3), unique exact goal difference (2), uniquely closest goal difference (1), walkover (1), with tied categories awarding zero. Tests cover every edge case.
