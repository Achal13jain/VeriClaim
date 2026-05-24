# VeriClaim

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange)](https://firebase.google.com/)
[![Arc](https://img.shields.io/badge/Arc-ready%20architecture-37c8ff)](https://testnet.arcscan.app/)
[![x402](https://img.shields.io/badge/x402-mock%20mode-8b5cf6)](docs/x402-integration.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

VeriClaim is a pre-market verification layer for prediction markets. It turns
vague internet claims into structured, challengeable MarketSpecs using an
adversarial AI Court.

Live demo: https://veri-claim-livid.vercel.app

Repository: https://github.com/Achal13jain/VeriClaim

## Screenshots

| Landing page | Forge workflow |
| --- | --- |
| ![VeriClaim landing page](public/screenshots/home.png) | ![VeriClaim Forge page](public/screenshots/forge.png) |

## Why VeriClaim Exists

Prediction markets fail when questions are vague. A claim like "Bitcoin will
hit $150k this year" still needs a precise deadline, a binary outcome set, a
resolution source, a settlement rule, and edge-case handling before it can be
trusted by users, agents, or downstream infrastructure.

VeriClaim sits before market creation, trading, and settlement. It improves
question quality, resolution clarity, and auditability by turning messy claims
into reusable MarketSpecs that can be reviewed, challenged, saved, and shared.

## What VeriClaim Does

VeriClaim takes a source claim and produces a structured MarketSpec:

- a canonical claim
- a binary YES/NO question
- a deadline
- a category
- a resolution source
- a resolution rule
- edge cases
- critic objections
- judge verdict and scores
- a deterministic content hash

The result is not a betting market. It is a specification artifact that can be
inspected before any future market, oracle, or settlement system uses it.

## How the AI Court Works

VeriClaim uses three adversarial agent roles:

1. **Forger** converts the messy claim into a binary, time-bound MarketSpec.
2. **Critic** attacks ambiguity, weak sources, bad deadlines, vague entities,
   and missing edge cases.
3. **Judge** produces the final verdict, quality score, final question, and
   settlement-ready resolution rule.

Live provider mode uses separate model families for the Forger and Critic when
configured. If the required provider keys are missing or invalid, the app falls
back to deterministic demo-safe output so the product remains usable.

## Core Features

- AI Court MarketSpec generation through `/api/forge`
- relative-date handling for phrases such as "this year", "next month", and
  "before Q4"
- Zod validation for request and response payloads
- deterministic fallback mode when live AI providers are unavailable
- Firebase Auth with Google and optional anonymous demo sign-in
- Firestore persistence for users, specs, challenges, activity, payments, and
  mock proof metadata
- deterministic MarketSpec hashing with canonical JSON plus SHA-256
- readable public spec URLs with hash-backed source of truth
- public spec gallery and public spec detail pages
- Challenge Court for reviewing weak or ambiguous specs
- Forge Credits, reputation, levels, badges, and activity history
- dashboard with public stats, leaderboard, recent activity, and payment history
- mock Arc proof publishing
- mock x402-style unlock flow after free Forge usage

## Demo Flow

1. Open the landing page and review the AI Court preview.
2. Go to Forge and submit a claim.
3. Watch the Forger, Critic, and Judge phases complete.
4. Review the generated MarketSpec, scores, objections, and JSON.
5. Sign in, save the spec, and open the public spec page.
6. Challenge the spec if the wording or resolution rule is weak.
7. Publish a clearly labeled Mock Arc proof.
8. Open the dashboard to see public stats, reputation, badges, and mock payment
   history.

## Safety Boundaries

VeriClaim is intentionally scoped to MarketSpec creation:

- it does not create betting markets
- it does not execute trades
- it does not custody assets
- it does not provide financial advice
- it does not process real x402 payments in the current MVP
- it does not publish real Arc transactions in the current MVP

Mock Arc proof records are Firestore metadata only. Mock x402 unlocks do not
move real money.

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
- Zod
- Firebase Auth
- Firestore
- wagmi + viem
- Solidity and Foundry workspace for future Arc contract deployment

## Quick Start

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Run local checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

Use `.env.example` as the source of truth for local and Vercel configuration.
Provider keys and private deployment keys must stay server-side and must never
be committed.

```bash
NEXT_PUBLIC_APP_URL=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=
GROQ_MODEL=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_X402_MODE=mock
X402_PRICE_USD=0.01
X402_RECEIVER_ADDRESS=

NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC_URL=
NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS=
```

Only variables prefixed with `NEXT_PUBLIC_` are exposed to browser code. Do not
put provider secrets, private keys, Firebase service account values, wallet seed
phrases, or Vercel tokens in public variables.

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app and copy the browser config into `.env.local`.
3. Enable Google sign-in.
4. Enable Anonymous sign-in if you want the Demo button to work.
5. Create Firestore in production mode.
6. Deploy Firestore rules:

```bash
firebase deploy --project <project-id> --only firestore:rules
```

7. Add authorized domains in Firebase Auth:
   - `localhost`
   - your Vercel production domain
   - any Vercel preview domains you plan to use

See `docs/firebase-setup.md` for more detail.

## Vercel Deployment

1. Import the repository into Vercel.
2. Use `npm install` for install and `npm run build` for build.
3. Add the environment variables from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed URL.
5. Deploy.
6. Add the deployed Vercel domain to Firebase Auth authorized domains.
7. Deploy `firestore.rules` to the same Firebase project used by the app.

## Arc Integration Status

VeriClaim is designed for Arc-native market infrastructure, but the current MVP
uses a clearly labeled mock proof flow.

Current mode:

- stores Arc-ready proof metadata in Firestore
- generates mock transaction hashes for demo UX
- labels proof records as Mock Arc proof
- does not submit a real transaction to Arc
- keeps wallet connection hidden until real publishing is enabled

Arc CLI setup:

```bash
uv tool install git+https://github.com/the-canteen-dev/ARC-cli
```

Future Arc work:

- deploy `VeriClaimRegistry` to Arc Testnet
- replace mock proof publishing with real contract calls
- anchor MarketSpec hashes on Arc

The `contracts/` folder contains the deferred registry workspace.

## x402 Integration Status

The current MVP uses a mock x402-style unlock layer:

- first 3 Forge generations are free for signed-in users
- later Forge runs use 1 Forge Credit or a mock x402 unlock
- mock x402 receipts are saved for product flow and dashboard history
- no real money moves

Real x402 facilitator support is planned after the core MarketSpec flow is
stable.

## Known Limitations

- Mock Arc proof publishing is not a real on-chain transaction.
- Mock x402 unlocks are not real payments.
- Firebase Admin SDK is not implemented yet.
- Credits, reputation, mock payments, challenges, and mock proof writes are not
  fully server-authoritative yet.
- `/api/forge` uses in-memory rate limiting and can still be called directly.
- Public spec pages use generic OpenGraph metadata.
- ERC-8004-aware agent identity is represented as planned adapter work.
- The Foundry contract workspace is present but not required for the MVP.

## Roadmap

- Move privileged economy, challenge, payment, and proof writes behind
  server-side Firebase Admin routes.
- Enforce Forge Credit and x402 unlocks server-side.
- Deploy the Arc Testnet registry contract.
- Switch proof publishing from mock metadata to real Arc transactions.
- Integrate real x402 facilitator support.
- Add per-spec OpenGraph images.
- Persist agent identity metadata and expand ERC-8004 adapter support.
- Add CI, browser smoke tests, and Foundry contract tests.

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md`, keep changes focused,
run the local checks before opening a pull request, and never commit secrets.

## License

MIT. See `LICENSE`.
