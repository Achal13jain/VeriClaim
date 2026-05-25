import Link from "next/link";
import { CircuitBoard, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const githubUrl = "https://github.com/Achal13jain/VeriClaim";
const liveDemoUrl = "https://veri-claim-livid.vercel.app";

const productLinks = [
  { href: "/forge", label: "Forge" },
  { href: "/specs", label: "Specs" },
  { href: "/agents", label: "Agents" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/35">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md border border-sky-400/30 bg-sky-400/12 text-sky-600 dark:text-sky-300">
              <CircuitBoard className="size-5" />
            </span>
            <span>
              <span className="block font-display text-2xl leading-none">
                VeriClaim
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Verifiable MarketSpecs
              </span>
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Pre-market verification for turning messy claims into structured,
            challengeable MarketSpecs.
          </p>
        </div>

        <div>
          <p className="section-eyebrow mb-3">Product</p>
          <div className="grid gap-2 text-sm">
            {productLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="section-eyebrow mb-3">Project</p>
          <div className="grid gap-2 text-sm">
            <Link
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground"
            >
              GitHub
              <ExternalLink className="size-3" />
            </Link>
            <Link
              href={liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground"
            >
              Live demo
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        <div>
          <p className="section-eyebrow mb-3">Status</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="violet">Mock Arc proof</Badge>
            <Badge variant="violet">Mock x402</Badge>
            <Badge variant="glass">No betting</Badge>
            <Badge variant="glass">No trading</Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}
