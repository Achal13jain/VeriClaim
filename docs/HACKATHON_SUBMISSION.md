# Event Submission Notes

## Project Summary

VeriClaim turns messy internet claims into verifiable prediction-market specs
using an adversarial AI agent flow. The product focuses on the MarketSpec layer:
structured questions, outcomes, deadlines, resolution sources, rules, edge
cases, scores, and public proof-ready records.

## Links

- Live demo: https://veri-claim-livid.vercel.app
- GitHub repo: https://github.com/Achal13jain/VeriClaim

## Key Features

- Forger, Critic, and Judge agent flow.
- MarketSpec generation from natural-language claims.
- Relative date handling for common phrases such as "this year" and "before Q4".
- Firebase Auth and Firestore persistence.
- Public spec pages at `/spec/[hash]`.
- Challenge Court for reviewing weak or ambiguous specs.
- Credits, reputation, badges, dashboard, and leaderboard.
- Mock Arc proof publishing with Arc-ready metadata.
- Mock x402-style unlock flow.

## How Arc Fits

VeriClaim is designed for Arc-native market infrastructure. A MarketSpec hash is
the compact proof object that can be anchored to Arc while the full human-readable
spec remains available in the app.

Current implementation:

- uses mock Arc proof publishing
- stores Arc-ready proof metadata
- does not yet publish real transactions to Arc

Future real Arc integration:

- deploy `VeriClaimRegistry` to Arc Testnet
- replace the mock proof flow with real contract publishing
- anchor MarketSpec hashes on Arc
- show verified Arc transaction links on public spec pages

## Judging Highlights

- Converts vague claims into structured, auditable MarketSpecs.
- Uses an adversarial agent flow instead of a single-pass answer.
- Keeps safety boundaries clear: no betting, no trading, no financial advice.
- Demonstrates persistence, public sharing, challenges, reputation, and proof UX.
- Keeps Arc and x402 paths honest by labeling current flows as mock mode while
  preserving the planned integration architecture.
