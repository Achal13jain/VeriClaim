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
    <div className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-slate-950 text-slate-100 shadow-glass">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 truncate font-mono text-xs">
          <Braces className="size-4 text-court-green" />
          <span className="truncate">{title}</span>
        </div>
        <Badge variant="glass" className="shrink-0">
          demo schema
        </Badge>
      </div>
      <pre className="max-h-[420px] max-w-full overflow-auto p-4 font-mono text-xs leading-6">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
