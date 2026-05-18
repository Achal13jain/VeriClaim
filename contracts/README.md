# VeriClaim Contracts

Foundry workspace for the Arc Testnet proof registry.

The registry stores only hashes and metadata references. It never stores full
claims, MarketSpec JSON, user text, or financial content onchain.

## Setup

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
forge build
forge test
```

## Deploy To Arc Testnet

Required environment variables:

```bash
PRIVATE_KEY=
ARC_RPC_URL=
```

Deploy:

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

After deployment, set the frontend env var:

```bash
NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS=0x...
```

Arc Testnet:

- Chain ID: `5042002`
- Native currency: `USDC`
- Explorer: `https://testnet.arcscan.app`
