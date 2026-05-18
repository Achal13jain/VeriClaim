# Arc Integration

VeriClaim publishes saved MarketSpec hashes to Arc Testnet through the
`VeriClaimRegistry` contract. The app stores only proof metadata in Firestore
after the wallet transaction succeeds.

## Arc Testnet

- Chain ID: `5042002`
- Native currency: `USDC`
- Explorer: `https://testnet.arcscan.app`

## Contract Setup

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
forge build
forge test
```

## Deploy

Set deployment env vars:

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

## Frontend Environment

```bash
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app
NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS=
```

Restart `npm run dev` after changing these values.

## Publish Flow

1. User saves a MarketSpec to Firestore.
2. User connects wallet and switches to Arc Testnet.
3. Spec page calls `publishSpec(bytes32,string,uint256,uint256,uint256)`.
4. Contract stores only:
   - `bytes32 specHash`
   - `metadataURI`
   - agent IDs
   - creator/timestamp
5. After transaction confirmation, Firestore updates:
   - `specs/{hash}.arcPublished = true`
   - `specs/{hash}.arcTxHash = txHash`
   - `arc_proofs/{id}`
   - user reputation and badges

Publishing awards `+20` reputation and can grant `First Arc Proof`.

## Limitations

- Private keys are never used in frontend code.
- Contract verification depends on Arc explorer support.
- `NEXT_PUBLIC_ARC_RPC_URL` must point to a working Arc Testnet RPC.
- Firestore cannot verify the transaction on its own in the MVP; the client
  writes proof metadata after wagmi confirms the transaction.
