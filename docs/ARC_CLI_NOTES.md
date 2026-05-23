# Arc CLI Notes

## Install

Install the Arc CLI with:

```bash
uv tool install git+https://github.com/the-canteen-dev/ARC-cli
```

## Current MVP

The current MVP uses mock Arc proof publishing. It stores Arc-ready proof
metadata in Firestore and labels the result as mock mode in the UI.

No real transaction is published to Arc in the current MVP.

## Future Arc Work

The next Arc step is deploying `VeriClaimRegistry` to Arc Testnet and replacing
the mock proof flow with real contract publishing.

Planned flow:

1. Deploy `VeriClaimRegistry` to Arc Testnet.
2. Configure `NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS`.
3. Publish MarketSpec hashes through the registry contract.
4. Store the real Arc transaction hash on the public spec record.
5. Link public spec pages to the Arc explorer transaction.
