import { Gauge } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function QualityScoreBadge({ score }: { score: number }) {
  const variant = score >= 90 ? "success" : score >= 80 ? "blue" : "warning";

  return (
    <Badge variant={variant} className="gap-1.5">
      <Gauge className="size-3.5" />
      Quality {score}
    </Badge>
  );
}
