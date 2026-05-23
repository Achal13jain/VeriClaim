# Architecture

VeriClaim is a Next.js application that turns a source claim into a structured
MarketSpec through an adversarial agent flow. The current architecture is split
into five main layers.

## 1. Frontend

The App Router pages live in `src/app`. Most UI is composed from reusable
components in `src/components`.

Primary routes:

- `/` landing page
- `/forge` claim intake and MarketSpec generation
- `/specs` public gallery
- `/spec/[hash]` public spec detail page
- `/agents` agent profiles
- `/dashboard` reputation, activity, and proof dashboard

The frontend uses Tailwind CSS, shadcn/ui-style primitives, Framer Motion, GSAP,
Lenis, Lucide icons, and Recharts.

## 2. AI Court

The AI Court code lives in `src/lib/agents`.

Flow:

1. Forger Agent drafts a binary, time-bound MarketSpec.
2. Critic Agent reviews ambiguity, deadlines, resolution sources, and edge
   cases.
3. Judge Agent produces the final verdict, question, resolution rule, scores,
   confidence, and reasoning.

`/api/forge` validates the input and output with Zod. If live provider keys are
missing or a model response fails validation, the route falls back to
deterministic demo data.

## 3. Persistence

Firebase client helpers live in `src/lib/firebase`.

Firestore collections used by the current implementation:

- `users`
- `specs`
- `challenges`
- `payments`
- `arc_proofs`
- `activity_events`

Saved MarketSpecs use deterministic hashing:

1. Canonicalize the MarketSpec payload.
2. Hash the canonical JSON with SHA-256.
3. Use the hash as the public document ID and route parameter.

## 4. Gamification

Gamification rules live in `src/lib/gamification`.

The gamification layer tracks:

- Forge Credits
- reputation
- user levels
- badges
- activity events
- challenge outcomes

Some economy writes still happen through client-side Firestore transactions.
Server-authoritative Firebase Admin routes are planned before production use.

## 5. Arc And x402

Arc integration code lives in `src/lib/arc`.

Current implementation:

- mock Arc proof publishing
- Arc-ready proof metadata in Firestore
- no real Arc transaction yet

Future Arc work:

- deploy `VeriClaimRegistry` to Arc Testnet
- call the registry from the spec page
- anchor MarketSpec hashes on Arc
- store and display verified Arc transaction hashes

x402 code lives in `src/lib/payments`.

Current implementation:

- mock x402-style unlocks
- 3 free Forge generations
- Forge Credit unlock path
- no real payment processing

Real x402 receipt verification is planned as a later integration.
