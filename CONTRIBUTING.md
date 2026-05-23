# Contributing

Thanks for taking an interest in VeriClaim. This project is a hackathon MVP for
turning messy internet claims into structured MarketSpecs.

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Run the app:

```bash
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## Branch Naming

Use short, descriptive branch names:

- `feature/<short-name>`
- `fix/<short-name>`
- `docs/<short-name>`
- `chore/<short-name>`

Examples:

- `feature/arc-registry-publish`
- `fix/auth-error-copy`
- `docs/firebase-setup`

## Commit Style

Use concise conventional-style commits:

- `feat: add saved spec filters`
- `fix: handle auth popup cancellation`
- `docs: update Arc notes`
- `chore: clean env sample`

Keep commits focused. Avoid mixing unrelated refactors with feature work.

## No Secrets

Never commit:

- `.env` files
- private keys
- Firebase service account files
- provider API keys
- local credentials

Use `.env.local` for local values and Vercel environment variables for deployed
values.

## Pull Request Guidance

Pull requests should include:

- a short summary of the change
- screenshots for UI changes
- notes about any new environment variables
- testing performed
- known limitations or follow-up work

Avoid large rewrites unless the issue explicitly calls for them. Prefer small,
reviewable changes that keep the MVP stable.
