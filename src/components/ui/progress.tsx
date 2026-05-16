import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value = 0,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#39a7ff,#35f2a4,#9b7cff)] transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export { Progress };
