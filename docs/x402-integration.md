# x402 Integration

VeriClaim currently uses a clearly labeled mock x402 payment flow. It models
premium Forge unlocks without moving real money.

## Current Mode

```bash
NEXT_PUBLIC_X402_MODE=mock
X402_PRICE_USD=0.01
X402_RECEIVER_ADDRESS=
```

The Forge page allows:

1. First 3 signed-in MarketSpec generations for free.
2. After the free allowance, one generation can be unlocked with:
   - `1` Forge Credit, or
   - a mock x402 receipt worth `$0.01`.
3. Challenge Court remains free.
4. Mock Arc proof publishing remains free.

The UI always labels this as **Mock x402 payment**. No real money moves.
The current unlock gate is designed for demo UX and is not a production payment
or entitlement system. Server-side enforcement with verified payment receipts is
deferred.

## Data Model

Payment documents are written to `payments/{id}`:

```json
{
  "userId": "firebase-uid",
  "type": "forge_unlock",
  "mode": "mock_x402",
  "amountUsd": 0.01,
  "creditsSpent": 0,
  "txReference": "mock_x402_...",
  "status": "completed",
  "createdAt": "ISO timestamp"
}
```

Forge Credit unlocks use the same collection with `mode: "forge_credit"`,
`amountUsd: 0`, and `creditsSpent: 1`.

User documents track:

```json
{
  "freeForgeUsed": 0,
  "totalMockPayments": 0,
  "totalCreditsSpent": 0
}
```

## API Route

`POST /api/payment` validates the mock request and returns a mock receipt:

```json
{
  "userId": "firebase-uid",
  "type": "forge_unlock",
  "mode": "mock_x402"
}
```

The client sends a Firebase ID token in the `Authorization` header. The current
implementation performs best-effort token ownership checks and relies on
Firestore rules to ensure receipts are saved only by the signed-in owner.

## Future Real x402 Path

The current abstraction keeps these pieces replaceable:

- `lib/payments/types.ts`
- `lib/payments/x402.ts`
- `lib/payments/mockPayment.ts`
- `app/api/payment/route.ts`
- `components/payments/PaymentModal.tsx`
- `components/payments/PaymentHistory.tsx`

Real x402 support can replace mock receipt generation with a facilitator flow
while preserving the Forge unlock contract and Firestore history shape.

## Limitations

- This is not a real payment.
- No card, wallet, bank, or stablecoin payment is processed.
- `X402_RECEIVER_ADDRESS` is reserved for later integration and is not exposed
  to the client.
- Firebase Admin verification is deferred; Firestore rules remain the final
  client-write boundary in the current implementation.
- `/api/forge` remains callable directly; the Forge page enforces
  free-use, Forge Credit, and mock x402 UX for the demo path.
