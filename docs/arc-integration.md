# Arc Integration

VeriClaim's current MVP uses a clearly labeled mock Arc Testnet proof flow. This
keeps the demo complete without requiring Foundry, Forge, a deployed contract,
or a wallet transaction during early review.

## Current MVP Mode

On a saved `/spec/[hash]` page, an authenticated user can click **Publish Proof
on Arc**. The app then:

1. Generates a realistic mock transaction hash beginning with `0x`.
2. Updates `specs/{hash}` with:
   - `arcPublished: true`
   - `arcTxHash`
   - `arcPublishedAt`
   - `arcMode: "mock"`
3. Creates an `arc_proofs` document with:
   - `specHash`
   - `chainId: 5042002`
   - `chainName: "Arc Testnet"`
   - `txHash`
   - `mode: "mock"`
   - `publishedBy`
   - `createdAt`
4. Awards `+20` reputation and the `First Arc Proof` badge when applicable.
5. Shows the proof as **Mock Testnet Proof** in the Arc proof panel.

The UI must not present this as a real on-chain transaction. It is an MVP proof
record that matches the intended Firestore schema and final user experience.
No wallet, RPC call, contract address, Foundry install, or testnet faucet is
required for the current mock flow.

## Arc Testnet

- Chain ID: `5042002`
- Native currency: `USDC`
- Explorer: `https://testnet.arcscan.app`

## Frontend Environment

The mock flow does not require a contract address. These variables remain for
the future real integration path:

```bash
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app
NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS=
```

Restart `npm run dev` after changing environment variables.

## Future Real Contract Setup

Real Arc contract publishing is deferred. The `contracts/` folder remains in
the repo so it can be activated later with Foundry/Forge.

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
forge build
forge test
```

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

## Future Contract Publish Flow

The planned real path will:

1. Connect a wallet and switch to Arc Testnet.
2. Call `publishSpec(bytes32,string,uint256,uint256,uint256)`.
3. Store only the MarketSpec hash, metadata URI, agent IDs, creator, and
   timestamp on-chain.
4. Confirm the transaction with wagmi/viem.
5. Update Firestore with `arcMode: "contract"` and the real Arc transaction
   hash.

## Limitations

- The current Arc proof is mock/testnet metadata, not a real on-chain tx.
- Private keys are never used in frontend code.
- Firestore cannot independently verify mock or future contract transactions.
- Real contract verification depends on Arc explorer support.
