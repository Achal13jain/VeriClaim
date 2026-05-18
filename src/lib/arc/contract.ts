export const VERICLAIM_REGISTRY_ABI = [
  {
    type: "function",
    name: "publishSpec",
    stateMutability: "nonpayable",
    inputs: [
      { name: "specHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
      { name: "forgerAgentId", type: "uint256" },
      { name: "criticAgentId", type: "uint256" },
      { name: "judgeAgentId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const configuredAddress =
  process.env.NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS?.trim() ||
  process.env.NEXT_PUBLIC_MARKET_SPEC_REGISTRY_ADDRESS?.trim() ||
  "";

export const VERICLAIM_REGISTRY_ADDRESS = configuredAddress as
  | `0x${string}`
  | "";

export function isArcContractConfigured() {
  return /^0x[a-fA-F0-9]{40}$/.test(VERICLAIM_REGISTRY_ADDRESS);
}
