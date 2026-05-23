# VeriClaim

VeriClaim is the verifiable MarketSpec layer for AI-created prediction markets.
It turns messy claims into prediction-market-ready MarketSpecs using an AI Court:
Forger Agent, Critic Agent, and Judge Agent.

The current MVP includes the premium UI shell, AI MarketSpec generation,
Firebase Auth/Firestore persistence, gamified reputation, challenges, and a
clearly labeled mock Arc Testnet proof flow plus mock x402 Forge unlocks. It
does not implement betting, trading, financial advice, real payments, or real
on-chain publishing yet.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Framer Motion
- GSAP + ScrollTrigger
- Lenis
- Lucide React
- Recharts
- next-themes
- wagmi + viem future contract path
- Foundry contract scaffold for deferred Arc deployment

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment

Copy `.env.example` to `.env.local` when live services are added. With keys
missing, VeriClaim must remain demoable in deterministic fallback mode.

## SRS Alignment

The UI foundation covers the first visible shell for:

- `REQ-LAND-*` landing page, AI Court workflow, disclaimers, theme support.
- `REQ-FORGE-001` through `REQ-FORGE-003`, `REQ-FORGE-009`,
  `REQ-FORGE-010`, and demo-mode presentation.
- `REQ-GALLERY-*` mock gallery listing, filters, and sorting controls.
- `REQ-SPEC-*` mock public spec detail page at `/spec/[hash]`.
- `REQ-AGENT-*` mock agent profiles with ERC-8004 adapter badges.
- `REQ-GAME-003` through `REQ-GAME-007` mock credits, reputation, stats,
  leaderboard, and activity feed.
- `REQ-PAY-005` mock x402 badge.
- `REQ-PAY-*` mock x402 unlock flow for premium Forge generations.
- Arc proof MVP uses Firestore-backed `mode: "mock"` proof records.

## Non-Goals In This Pass

- Real betting or trading
- Financial advice
- Real on-chain Arc proof publishing
- Real x402 payment processing
