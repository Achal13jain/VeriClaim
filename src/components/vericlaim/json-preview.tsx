import { Braces } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function JSONPreview({
  data,
  title = "MarketSpec JSON",
}: {
  data: unknown;
  title?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-slate-950 text-slate-100 shadow-glass">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <Braces className="size-4 text-court-green" />
          {title}
        </div>
        <Badge variant="glass">demo schema</Badge>
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 font-mono text-xs leading-6">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
