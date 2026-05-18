"use client";

import Link from "next/link";
import { ExternalLink, Link2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { arcTxUrl } from "@/lib/arc/chains";
import type { MarketSpecRecord } from "@/lib/types";
import { formatHash } from "@/lib/utils";

export function ArcProofPanel({ spec }: { spec: MarketSpecRecord }) {
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
          <div className="text-sm text-muted-foreground">Arc tx</div>
          {spec.arcPublished && spec.arcTxHash ? (
            <Link
              href={arcTxUrl(spec.arcTxHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-2 break-all font-mono text-xs text-court-blue"
            >
              {formatHash(spec.arcTxHash, 10, 8)}
              <ExternalLink className="size-3 shrink-0" />
            </Link>
          ) : (
            <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Link2 className="size-3.5" />
              pending
            </div>
          )}
        </div>
        <Badge variant={spec.arcPublished ? "blue" : "glass"}>
          {spec.arcPublished ? "Onchain proof anchored" : "Awaiting Arc proof"}
        </Badge>
      </CardContent>
    </Card>
  );
}
