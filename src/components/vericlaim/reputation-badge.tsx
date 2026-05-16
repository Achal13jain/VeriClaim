import { Award } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export function ReputationBadge({
  reputation,
  label = "Reputation",
}: {
  reputation: number;
  label?: string;
}) {
  return (
    <Badge variant="success" className="gap-1.5">
      <Award className="size-3.5" />
      {label} {formatNumber(reputation)}
    </Badge>
  );
}
