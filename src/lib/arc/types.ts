export type ArcProofMode = "mock" | "contract";

export interface ArcProofRecord {
  specHash: string;
  chainId: number;
  chainName: string;
  txHash: `0x${string}`;
  mode: ArcProofMode;
  publishedBy: string;
  createdAt: string;
  contractAddress?: string | null;
}
