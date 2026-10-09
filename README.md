# Puzzle Log (Cloudflare Pages + Neon)

Static front end in `public/`, API in `functions/` (Pages Functions), shared code in `lib/`, data in Neon Postgres.
Users sign up with a username and password; each person only sees their own puzzles.

## 1. Neon
1. Create a project at neon.tech.
2. In the SQL Editor, run `schema.sql` (see the comments in it if you already have the older puzzles table).
3. Copy the connection string (Dashboard > Connect), the pooled one.

## 2. Cloudflare Pages
1. Push this folder to GitHub.
2. Workers & Pages > Create > Pages > Connect to Git.
3. Build command `npm install`, output directory `public`.
4. Settings > Variables and Secrets: add `DATABASE_URL` as a secret.
5. Redeploy.

CLI alternative: `npm install && npx wrangler pages deploy public --project-name puzzle-log`, then add the secret in the dashboard.

## Local development
    npm install
    cp .dev.vars.example .dev.vars   # fill in DATABASE_URL
    npm run dev

## Notes
- Passwords are hashed with PBKDF2-SHA256 (100,000 iterations) and a per-user salt. Sessions are random tokens in an HttpOnly cookie (30 days); only a hash of the token is stored.
- There is no password reset. A forgotten password cannot be recovered.
- Add a Cloudflare rate limiting rule on `/api/login` and `/api/signup` to slow down guessing and spam sign-ups.

## Deploy on every push (GitHub Actions)
`.github/workflows/deploy.yml` deploys to the `puzzle-log` Pages project whenever you push to `main`.
Add two repository secrets (GitHub repo > Settings > Secrets and variables > Actions):
- `CLOUDFLARE_API_TOKEN`: a token with Account > Cloudflare Pages > Edit
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID
`DATABASE_URL` stays in the Pages project (set once with `wrangler pages secret put`), so it is kept between deploys.
