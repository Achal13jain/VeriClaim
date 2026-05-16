# Service Adapters

Live adapters are intentionally deferred in the UI foundation pass.

Planned modules:

- `ai/` for Gemini, Groq, OpenAI/OpenRouter, and deterministic demo fallback.
- `firebase/` for Firebase Auth, Firestore, and Firebase Admin helpers.
- `arc/` for wagmi/viem chain configuration and proof publishing.
- `x402/` for the mock payment gate and future real x402 integration.

The current app uses typed mock data only and does not perform real AI calls,
Firebase writes, Arc transactions, betting, trading, or financial advice.
