"use client";

import Link from "next/link";
import { ExternalLink, Link2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { arcTxUrl } from "@/lib/arc/chains";
import type { MarketSpecRecord } from "@/lib/types";
import { formatHash } from "@/lib/utils";

export function ArcProofPanel({ spec }: { spec: MarketSpecRecord }) {
  const isMockProof = spec.arcMode === "mock";

  return (
    <Card className="glass-panel h-fit min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-court-blue" />
          Arc proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border/70 bg-background/60 p-3">
          <div className="text-sm text-muted-foreground">MarketSpec hash</div>
          <div className="mt-1 break-all font-mono text-xs">{spec.hash}</div>
        </div>
        <div className="rounded-md border border-border/70 bg-background/60 p-3">
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={spec.arcPublished ? "blue" : "glass"}>
              {spec.arcPublished ? "Published" : "Pending"}
            </Badge>
            {spec.arcPublished ? (
              <Badge variant={isMockProof ? "violet" : "success"}>
                {isMockProof ? "Mock Testnet Proof" : "Contract Proof"}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="rounded-md border border-border/70 bg-background/60 p-3">
          <div className="text-sm text-muted-foreground">Chain</div>
          <div className="mt-1 font-mono text-xs">Arc Testnet</div>
        </div>
        <div className="rounded-md border border-border/70 bg-background/60 p-3">
          <div className="text-sm text-muted-foreground">Tx hash</div>
          {spec.arcPublished && spec.arcTxHash ? (
            isMockProof ? (
              <div className="mt-1 flex items-center gap-2 break-all font-mono text-xs text-court-violet">
                <Sparkles className="size-3 shrink-0" />
                {formatHash(spec.arcTxHash, 10, 8)}
              </div>
            ) : (
              <Link
                href={arcTxUrl(spec.arcTxHash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-2 break-all font-mono text-xs text-court-blue"
              >
                {formatHash(spec.arcTxHash, 10, 8)}
                <ExternalLink className="size-3 shrink-0" />
              </Link>
            )
          ) : (
            <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Link2 className="size-3.5" />
              pending
            </div>
          )}
        </div>
        {spec.arcPublishedAt ? (
          <div className="rounded-md border border-border/70 bg-background/60 p-3">
            <div className="text-sm text-muted-foreground">Published at</div>
            <div className="mt-1 font-mono text-xs">
              {new Date(spec.arcPublishedAt).toLocaleString()}
            </div>
          </div>
        ) : null}
        <p className="rounded-md border border-court-violet/25 bg-court-violet/10 p-3 text-xs leading-5 text-muted-foreground">
          {isMockProof
            ? "Mock Arc proof record for the MVP. No real on-chain transaction is claimed; real contract publishing is planned."
            : "Only hashes and metadata references belong on Arc; full claim text stays in Firestore."}
        </p>
      </CardContent>
    </Card>
  );
}
