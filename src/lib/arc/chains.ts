import { defineChain } from "viem";

export const ARC_TESTNET_CHAIN_ID =
  Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? "5042002") || 5042002;

export const DEFAULT_ARC_RPC_URL = "https://rpc.testnet.arc.network";

export const ARC_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL?.trim() || DEFAULT_ARC_RPC_URL;

export const ARC_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL?.trim() ||
  "https://testnet.arcscan.app";

export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: ARC_EXPLORER_URL,
    },
  },
  testnet: true,
});

export function arcTxUrl(txHash: string) {
  return `${ARC_EXPLORER_URL.replace(/\/$/, "")}/tx/${txHash}`;
}
