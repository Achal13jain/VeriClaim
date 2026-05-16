"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircuitBoard, Coins, ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/forge", label: "Forge" },
  { href: "/specs", label: "Specs" },
  { href: "/agents", label: "Agents" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-sky-400/30 bg-sky-400/12 text-sky-600 dark:text-sky-300">
            <CircuitBoard className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-2xl leading-none">
              VeriClaim
            </span>
            <span className="hidden truncate font-mono text-[11px] text-muted-foreground sm:block">
              verifiable MarketSpecs
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                size="sm"
              >
                <Link
                  href={item.href}
                  className={cn(active && "text-foreground")}
                >
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Badge variant="glass" className="gap-1.5">
              <Coins className="size-3.5" />
              100 credits
            </Badge>
            <Badge variant="success" className="gap-1.5">
              <ShieldCheck className="size-3.5" />
              Demo safe
            </Badge>
          </div>
          <ThemeToggle />
          <Button asChild variant="court" size="sm" className="hidden sm:flex">
            <Link href="/forge">Forge</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
