# Three-Minute Demo Script

Use this flow for a same-day hackathon presentation.

## 0:00-0:20 - Landing Page

"VeriClaim turns messy internet claims into verifiable MarketSpecs. It is not a
betting app and it does not trade. It is the spec layer: the structured,
auditable object a prediction market would need before anyone should trust it."

Point to:

- Hero headline: "Turn claims into verifiable markets."
- AI Court workflow.
- No betting, no trading, no financial advice labels.

## 0:20-0:55 - Forge A Claim

Open `/forge`.

Paste:

```text
Bitcoin will hit $150k this year.
```

Click generate.

"The Forger converts the claim into a binary, time-bound MarketSpec. The Critic
attacks ambiguity and resolution problems. The Judge produces the final question,
resolution rule, verdict, and confidence."

Point to:

- Forger running.
- Critic running.
- Judge running.
- MarketSpec ready.

## 0:55-1:20 - Show The AI Court Output

Call out:

- Final question.
- Deadline.
- Resolution source.
- Resolution rule.
- Edge cases.
- Quality score.
- Critic objections.
- Judge reasoning.

"The app validates outputs with Zod and falls back to deterministic demo mode if
provider keys are missing or model output is invalid."

## 1:20-1:45 - Save And Open Public Spec

Click **Save MarketSpec**.

Open the `/spec/[hash]` link.

"The saved spec gets a deterministic SHA-256 hash over canonical JSON, so the
same content always produces the same public spec ID."

Point to:

- Public URL.
- JSON preview.
- Agent trace.
- Arc proof pending state.

## 1:45-2:10 - Challenge Court

Click **Challenge this spec**.

Choose a reason such as "Weak deadline" or "Bad resolution source", then submit.

"Challenges let users earn reputation by finding bad specs. The Challenge Court
returns a ruling, suggested fixes, and reward changes."

Point to:

- Challenge ruling.
- Reputation/credit toast.
- Updated challenge count.

## 2:10-2:30 - Mock Arc Proof

Click **Publish Proof on Arc**.

"For this MVP, Arc publishing is a clearly labeled mock Testnet proof. It writes
the same Firestore schema and user experience we will use for the real contract,
but it does not pretend a real on-chain transaction happened."

Point to:

- Published status.
- Mock Testnet Proof label.
- Tx hash.
- `+20` reputation / First Arc Proof badge if shown.

## 2:30-2:50 - Dashboard And Leaderboard

Open `/dashboard`.

Show:

- Total specs.
- Blessed specs.
- Challenged specs.
- Arc published count.
- Leaderboard.
- Recent activity.
- Payment history.

"The product loop is not just generation. It is forging, critique, reputation,
challenges, proof, and public shareability."

## 2:50-3:00 - Mock x402 And Close

Return briefly to `/forge` or mention the modal if the account has used the free
allowance.

"After three free generations, VeriClaim asks for one Forge Credit or a mock
x402 unlock worth one cent. It is demo mode today; the abstraction is ready for a
real x402 facilitator later."

Close:

"The next upgrades are Firebase Admin-backed trust boundaries, real Arc
`publishSpec` transactions, real x402 receipts, and richer OpenGraph share
pages."
