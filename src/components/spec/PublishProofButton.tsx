"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createMockArcProof } from "@/lib/arc/mockProof";
import { useAuthState } from "@/lib/firebase/auth";
import {
  firebaseReady,
  publishMockArcProofResult,
} from "@/lib/firebase/firestore";
import type { MarketSpecRecord } from "@/lib/types";
import { toSafeClientError } from "@/lib/utils/safeMessages";

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
  const router = useRouter();
  const { configured, user } = useAuthState();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabledReason =
    !configured || !firebaseReady()
      ? "Firebase is not configured. Add env vars before publishing."
      : !user
        ? "Sign in before publishing a mock Arc proof."
        : "";

  async function publish() {
    if (disabledReason || !user) {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/spec/${spec.hash}`)}`);
        return;
      }

      setError(disabledReason || "Sign in before publishing a mock Arc proof.");
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const proof = createMockArcProof({
        specHash: spec.hash,
        publishedBy: user.uid,
      });
      const result = await publishMockArcProofResult({ spec, user, proof });

      onPublished(result.updatedSpec);
      onReward({
        creditsDelta: result.creditAwarded,
        reputationDelta: result.reputationAwarded,
        badgesAwarded: result.badgesAwarded,
        message: result.alreadyPublished
          ? "Arc proof already saved"
          : "Mock Arc proof reward",
      });
    } catch (caughtError) {
      setError(
        toSafeClientError(
          caughtError,
          "Could not publish this mock Arc proof. Check sign-in and Firestore access.",
        ),
      );
    } finally {
      setPublishing(false);
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
        disabled={publishing}
        onClick={publish}
      >
        {publishing ? (
          <>
            <Loader2 className="animate-spin" />
            Publishing proof to Arc...
          </>
        ) : (
          <>
            <Sparkles />
            Publish Proof on Arc
          </>
        )}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        Mock mode creates an Arc Testnet proof record in Firestore. Real contract
        publishing can plug into this same flow later.
      </p>
      {disabledReason ? (
        <p className="text-xs leading-5 text-court-amber">{disabledReason}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
