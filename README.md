# Real Estate Backend

## Run

```bash
npm install
npm run start:dev
```

## Build

```bash
npm run build
npm run start:prod
```

## Required Environment

Copy `.env.example` to `.env` and set:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `DB_SYNCHRONIZE`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `CORS_ORIGIN`

## Production Notes

- `synchronize` is disabled automatically in production.
- Set `DB_SYNCHRONIZE=true` only if you intentionally want TypeORM to create/update schema on deploy.
- Set `DB_SSL=true` when your hosted Postgres requires SSL.
- Uploaded files use `/tmp/uploads` in serverless/production mode.
