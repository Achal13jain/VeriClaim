import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        glass:
          "border-white/20 bg-white/10 text-foreground backdrop-blur-xl dark:border-white/10 dark:bg-white/10",
        success:
          "border-emerald-400/30 bg-emerald-400/12 text-emerald-600 dark:text-emerald-300",
        warning:
          "border-amber-400/30 bg-amber-400/12 text-amber-700 dark:text-amber-300",
        violet:
          "border-violet-400/30 bg-violet-400/12 text-violet-700 dark:text-violet-300",
        blue: "border-sky-400/30 bg-sky-400/12 text-sky-700 dark:text-sky-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
