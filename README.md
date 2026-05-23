# VeriClaim

VeriClaim is a verifiable MarketSpec layer for AI-created prediction markets. It
turns messy internet claims into prediction-market-ready MarketSpecs using an AI
Court made of a Forger Agent, Critic Agent, and Judge Agent.

This repository is an open-source hackathon MVP. It demonstrates the product
loop end to end, but it does not include real betting, real trading, financial
advice, real x402 payments, or real on-chain Arc publishing.

## Current MVP

- Premium Next.js 15 landing page and app shell.
- AI Court MarketSpec generation through `/api/forge`.
- Gemini Forger, Groq Critic, and OpenAI/OpenRouter/Groq Judge support.
- Deterministic demo fallback when provider keys are missing or live models fail.
- Zod validation for request and response payloads.
- Relative date handling for claims such as "this year", "next month", and
  "before Q4".
- Firebase Auth with Google and anonymous demo sign-in.
- Firestore persistence for public MarketSpecs.
- Deterministic MarketSpec hashing with RFC 8785-style canonicalization plus
  SHA-256.
- Public spec pages at `/spec/[hash]`.
- Credits, reputation, user levels, badges, and activity feed.
- Challenge Court flow for challenging weak MarketSpecs.
- Dashboard with leaderboard, stats, recent activity, and mock payment history.
- Mock Arc Testnet proof publishing.
- Mock x402-style Forge unlocks after the free generation allowance.

## Safety Notes

- VeriClaim does not take bets.
- VeriClaim does not execute trades.
- VeriClaim does not provide financial advice.
- Mock Arc proofs are clearly labeled as mock/testnet proof records.
- Mock x402 unlocks are clearly labeled as mock payments. No money moves.
- Real Arc contracts, real x402, Firebase Admin SDK enforcement, and production
  trust boundaries are planned upgrades.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- Framer Motion
- GSAP + ScrollTrigger
- Lenis
- Lucide React
- Recharts
- Firebase Auth
- Firestore
- Zod
- wagmi + viem future Arc contract path
- Solidity/Foundry contract scaffold for deferred Arc deployment

## Project Structure

```text
src/app/                 Next.js routes and API handlers
src/components/          UI, page, payment, shared, and spec components
src/lib/agents/          AI Court schemas, provider adapters, prompts, fallback
src/lib/firebase/        Firebase client Auth and Firestore helpers
src/lib/gamification/    Credits, reputation, levels, and badge rules
src/lib/payments/        Mock x402 payment abstraction
src/lib/arc/             Mock Arc proof helpers and future contract config
src/lib/utils/           Canonicalization and deterministic hashing
contracts/               Deferred Arc registry contract scaffold
docs/                    Firebase, Arc, x402, audit, release, and demo docs
```

## Local Development

Install dependencies:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

The app stays demoable when AI keys are missing by using deterministic fallback
data. Firebase browser config is required for sign-in and persistence.

Minimum Firebase demo:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_X402_MODE=mock
X402_PRICE_USD=0.01
```

Optional live AI:

```bash
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
```

See `.env.example` for future Arc, Firebase Admin, Foundry, and real x402
placeholders. Keep private keys and provider secrets out of client-side
`NEXT_PUBLIC_*` variables.

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app and copy the config into `.env.local` or Vercel env vars.
3. Enable Google sign-in.
4. Enable Anonymous sign-in for demo mode.
5. Create Firestore in production mode.
6. Deploy `firestore.rules`.
7. Add your local and Vercel domains under Firebase Auth authorized domains.

Detailed steps are in [docs/firebase-setup.md](docs/firebase-setup.md).

## Vercel Deployment

1. Import the GitHub repo into Vercel.
2. Use the default install/build commands:
   - Install: `npm install`
   - Build: `npm run build`
3. Add the environment variables from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed Vercel URL.
5. Deploy.
6. In Firebase Console, add the Vercel domain to Auth authorized domains.
7. Deploy Firestore rules to the same Firebase project used by Vercel.

The exact release checklist is in
[docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

## Demo Flow

A three-minute judge walkthrough is in
[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

Recommended sample claim:

```text
Bitcoin will hit $150k this year.
```

The expected MVP path is:

1. Forge the claim into a validated MarketSpec.
2. Show the Forger, Critic, and Judge trace.
3. Save the MarketSpec to Firestore.
4. Open the public `/spec/[hash]` page.
5. Challenge the spec if it is ambiguous.
6. Publish a clearly labeled mock Arc proof.
7. Show dashboard stats, leaderboard, and mock x402 history.

## Docs

- [Firebase setup](docs/firebase-setup.md)
- [Arc integration](docs/arc-integration.md)
- [x402 integration](docs/x402-integration.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- `docs/AUDIT_REPORT.md` is kept locally as the current project audit.

## Roadmap

- Move credits, reputation, payments, challenges, and proof writes behind
  Firebase Admin-backed API routes.
- Add server-side enforcement for Forge Credit and mock x402 unlocks.
- Deploy the real Arc Testnet `VeriClaimRegistry` contract.
- Switch proof publishing from mock Firestore records to real Arc transactions.
- Integrate real x402 facilitator flow.
- Add dynamic OpenGraph metadata for public spec pages.
- Persist canonical agent identity metadata and expand ERC-8004 adapter mode.
- Add CI, Playwright smoke tests, and Foundry contract tests.

## License

Hackathon MVP. Add a production license before wider release.
