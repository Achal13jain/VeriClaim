# Security

VeriClaim is a hackathon MVP. It is designed to demonstrate a MarketSpec flow
and Arc-ready architecture, not production custody, payment, or trading systems.

## Reporting Issues

Please report security issues privately to the project maintainer before opening
a public issue. Include:

- affected route, component, or workflow
- steps to reproduce
- expected impact
- screenshots or logs if useful

Do not include secrets, private keys, or personal credentials in reports.

## Secrets Policy

Never commit:

- `.env` files
- provider API keys
- Firebase service account files
- private keys
- wallet seed phrases
- production credentials

The repository includes `.env.example` for placeholder names only.

## Current MVP Limitations

- Firebase Admin SDK is not implemented yet.
- Credits, reputation, mock payments, challenges, and mock proof writes are not
  fully server-authoritative yet.
- The mock Arc proof flow is not a production security system.
- The mock x402 unlock flow is not a production payment system.
- `/api/forge` has in-memory rate limiting and can still be called directly.
- Public MarketSpecs should not contain sensitive private information.

## Production Security Work

Before production use, VeriClaim should add:

- server-side Firebase Admin enforcement for privileged writes
- verified x402 receipts
- real Arc transaction verification
- stronger rate limiting
- security review of Firestore rules
- monitoring and abuse controls for AI provider usage
