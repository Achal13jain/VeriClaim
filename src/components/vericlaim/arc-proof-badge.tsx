import { ExternalLink, Link2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatHash } from "@/lib/utils";

export function ArcProofBadge({
  published,
  txHash,
}: {
  published: boolean;
  txHash?: string | null;
}) {
  if (!published) {
    return (
      <Badge variant="glass" className="gap-1.5">
        <Link2 className="size-3.5" />
        Arc proof pending
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
