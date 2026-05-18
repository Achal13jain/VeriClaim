"use client";

import { useEffect, useMemo, useState } from "react";
import { Cable, Loader2, ShieldCheck, Wallet } from "lucide-react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { arcTestnet } from "@/lib/arc/chains";
import {
  VERICLAIM_REGISTRY_ABI,
  VERICLAIM_REGISTRY_ADDRESS,
  isArcContractConfigured,
} from "@/lib/arc/contract";
import { metadataUriForSpec, toBytes32Hash } from "@/lib/arc/hash";
import { useAuthState } from "@/lib/firebase/auth";
import { publishArcProofResult } from "@/lib/firebase/firestore";
import type { MarketSpecRecord } from "@/lib/types";

export function PublishProofButton({
  spec,
  onPublished,
  onReward,
}: {
  spec: MarketSpecRecord;
  onPublished: (spec: MarketSpecRecord) => void;
  onReward: (reward: {
    creditsDelta: number;
    reputationDelta: number;
    badgesAwarded: string[];
    message: string;
  }) => void;
}) {
  const { configured, user } = useAuthState();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: txHash, error: writeError, isPending, writeContract } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedTxHash, setSavedTxHash] = useState<string | null>(null);
  const contractConfigured = isArcContractConfigured();
  const wrongNetwork = isConnected && chainId !== arcTestnet.id;
  const disabledReason = useMemo(() => {
    if (spec.arcPublished) {
      return "Arc proof already published.";
    }
    if (!contractConfigured) {
      return "Contract address missing. Set NEXT_PUBLIC_VERICLAIM_CONTRACT_ADDRESS.";
    }
    if (!configured || !user) {
      return "Sign in before publishing a proof.";
    }
    if (!isConnected) {
      return "Connect a wallet before publishing.";
    }
    if (wrongNetwork) {
      return "Switch wallet to Arc Testnet.";
    }

    return "";
  }, [configured, contractConfigured, isConnected, spec.arcPublished, user, wrongNetwork]);

  useEffect(() => {
    if (!writeError) {
      return;
    }

    setError(writeError.message);
  }, [writeError]);

  useEffect(() => {
    if (!isSuccess || !txHash || savedTxHash === txHash || !user) {
      return;
    }

    let active = true;
    const confirmedHash = txHash;
    const signedInUser = user;

    async function saveProof() {
      try {
        const result = await publishArcProofResult({
          spec,
          user: signedInUser,
          txHash: confirmedHash,
          chainId: arcTestnet.id,
          contractAddress: VERICLAIM_REGISTRY_ADDRESS,
        });

        if (!active) {
          return;
        }

        setSavedTxHash(confirmedHash);
        onPublished(result.updatedSpec);
        onReward({
          creditsDelta: result.creditAwarded,
          reputationDelta: result.reputationAwarded,
          badgesAwarded: result.badgesAwarded,
          message: result.alreadyPublished
            ? "Arc proof already saved"
            : "Arc proof reward",
        });
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not save Arc proof.",
          );
        }
      }
    }

    saveProof();

    return () => {
      active = false;
    };
  }, [isSuccess, onPublished, onReward, savedTxHash, spec, txHash, user]);

  function publish() {
    setError(null);

    if (wrongNetwork) {
      switchChain({ chainId: arcTestnet.id });
      return;
    }

    try {
      writeContract({
        address: VERICLAIM_REGISTRY_ADDRESS as `0x${string}`,
        abi: VERICLAIM_REGISTRY_ABI,
        functionName: "publishSpec",
        args: [
          toBytes32Hash(spec.hash),
          metadataUriForSpec(spec.hash),
          BigInt(1),
          BigInt(2),
          BigInt(3),
        ],
        chainId: arcTestnet.id,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not prepare Arc transaction.",
      );
    }
  }

  if (spec.arcPublished) {
    return (
      <Button type="button" variant="outline" disabled className="w-full">
        <ShieldCheck />
        Proof published
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="court"
        className="w-full"
        disabled={Boolean(disabledReason) && !wrongNetwork}
        onClick={publish}
      >
        {isPending || confirming || switching ? (
          <>
            <Loader2 className="animate-spin" />
            {confirming ? "Confirming proof" : switching ? "Switching network" : "Publishing proof"}
          </>
        ) : wrongNetwork ? (
          <>
            <Cable />
            Switch to Arc Testnet
          </>
        ) : (
          <>
            <Wallet />
            Publish Proof on Arc
          </>
        )}
      </Button>
      {disabledReason && !wrongNetwork ? (
        <p className="text-xs leading-5 text-muted-foreground">{disabledReason}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
