"use client";

import { WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sampleClaims } from "@/lib/mock-data";

export function SampleClaimChips({
  claims = sampleClaims,
  onSelect,
}: {
  claims?: string[];
  onSelect?: (claim: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {claims.map((claim) => (
        <Button
          key={claim}
          type="button"
          variant="outline"
          size="sm"
          className="h-auto max-w-full justify-start whitespace-normal py-2 text-left"
          onClick={() => onSelect?.(claim)}
        >
          <WandSparkles className="size-3.5 shrink-0 text-court-violet" />
          <span className="line-clamp-2">{claim}</span>
        </Button>
      ))}
    </div>
  );
}
