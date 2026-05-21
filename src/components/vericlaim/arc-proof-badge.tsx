import { ExternalLink, Link2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ArcProofMode } from "@/lib/arc/types";
import { formatHash } from "@/lib/utils";

export function ArcProofBadge({
  published,
  txHash,
  mode,
}: {
  published: boolean;
  txHash?: string | null;
  mode?: ArcProofMode | null;
}) {
  if (!published) {
    return (
      <Badge variant="glass" className="gap-1.5">
        <Link2 className="size-3.5" />
        Arc proof pending
      </Badge>
    );
  }

  if (mode === "mock") {
    return (
      <Badge variant="violet" className="gap-1.5">
        <Sparkles className="size-3.5" />
        Mock Arc proof {txHash ? formatHash(txHash, 6, 4) : "saved"}
      </Badge>
    );
  }

  return (
    <Badge variant="blue" className="gap-1.5">
      <ShieldCheck className="size-3.5" />
      Arc proof {txHash ? formatHash(txHash, 6, 4) : "anchored"}
      <ExternalLink className="size-3" />
    </Badge>
  );
}
