# Service Adapter Notes

The original UI shell kept this folder as a placeholder. The current MVP now
uses focused adapter folders under `src/lib` instead:

- `agents/` for Gemini, Groq, OpenAI/OpenRouter, validation, and demo fallback.
- `firebase/` for Firebase Auth and Firestore client helpers.
- `arc/` for mock Arc proof publishing plus future wagmi/viem contract config.
- `payments/` for mock x402 receipts and Forge Credit unlock helpers.
- `gamification/` for credits, reputation, levels, and badges.

There is still no real betting, trading, financial advice, real x402 payment, or
real on-chain Arc publish flow in the MVP. Production-only service work should
prefer API routes backed by Firebase Admin SDK before tightening Firestore rules.
