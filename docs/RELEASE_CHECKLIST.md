# Release Checklist

Use this checklist before pushing a public hackathon demo branch or deploying to
Vercel.

## Pre-Push Checks

- Confirm `.env`, `.env.local`, `.env.production`, and any key files are not
  staged.
- Run `git status --short --ignored` and check for accidental secrets.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.
- Review `README.md` for accurate mock/real wording.
- Confirm `docs/AUDIT_REPORT.md` remains local unless you intentionally decide
  to publish it.

## Environment Variables

Required for the interactive Firebase demo:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_X402_MODE=mock`
- `X402_PRICE_USD=0.01`

Optional live AI keys:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

Future-only variables for real integrations:

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_ARC_CHAIN_ID`
- `NEXT_PUBLIC_ARC_RPC_URL`
- `NEXT_PUBLIC_ARC_EXPLORER_URL`
- `NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_MARKET_SPEC_REGISTRY_ADDRESS`
- `PRIVATE_KEY`
- `ARC_RPC_URL`
- `X402_RECEIVER_ADDRESS`

Never put private keys or API secrets in `NEXT_PUBLIC_*` variables.

## Firebase Rules

- Confirm `NEXT_PUBLIC_FIREBASE_PROJECT_ID` points to the same project where
  rules are deployed.
- Deploy rules:

```bash
firebase deploy --project <project-id> --only firestore:rules
```

- Confirm `specs` are publicly readable.
- Confirm users can create their own profile.
- Confirm signed-in users can save specs and challenges.
- Confirm anonymous demo users can still follow the save flow.
- Confirm mock payment history is readable only by the signed-in owner.

## Vercel Deployment

- Import the GitHub repo into Vercel.
- Use `npm install` as the install command.
- Use `npm run build` as the build command.
- Set `NEXT_PUBLIC_APP_URL` to the deployed URL.
- Add Firebase public env vars.
- Add AI provider env vars only if you want live AI instead of demo fallback.
- Keep Arc contract, Foundry private key, and real x402 receiver vars unset for
  the current MVP unless you are explicitly testing future integration work.
- Deploy and inspect Vercel build logs.

## Firebase Authorized Domains

In Firebase Console, open **Authentication -> Settings -> Authorized domains**
and add:

- `localhost`
- Your Vercel production domain.
- Any Vercel preview domain you will use during judging.

If Google popup sign-in fails after deployment, this is the first place to check.

## Demo Smoke Test

- Open the landing page and confirm the no betting/trading/advice disclaimers.
- Sign in with Google or anonymous demo mode.
- Forge `Bitcoin will hit $150k this year.`
- Confirm the generated deadline is not in the past.
- Save the MarketSpec.
- Open the `/spec/[hash]` page.
- Copy the public share link.
- Submit one Challenge Court challenge.
- Publish the mock Arc proof and confirm it is labeled mock/testnet.
- Visit the dashboard and confirm stats, leaderboard, activity, and payment
  history render.
- Exhaust free Forge uses or use an existing test user to show the mock x402
  unlock modal.

## Known MVP Limitations

- Real betting and trading are intentionally not implemented.
- Real financial advice is intentionally not provided.
- Arc proof publishing is mock mode.
- x402 payment is mock mode.
- Forge unlock enforcement is primarily client-side in the current MVP.
- Credits, reputation, challenges, mock payments, and mock proof writes are not
  Firebase Admin-backed yet.
- `agent_runs` browser writes are best-effort and may be denied by deployed
  rules; the trace is embedded in the saved spec.
- Public spec pages do not yet have dynamic OpenGraph images or metadata.
- Real ERC-8004 adapter integration is represented as product scaffolding only.
