"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircuitBoard, Menu, X } from "lucide-react";

import { AuthButton } from "@/components/shared/AuthButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/specs", label: "Specs" },
  { href: "/agents", label: "Agents" },
];

const authedNavItems = [
  { href: "/", label: "Home" },
  { href: "/forge", label: "Forge" },
  { href: "/specs", label: "Specs" },
  { href: "/agents", label: "Agents" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuthState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = user ? authedNavItems : publicNavItems;
  const showForgeCta = !user && !pathname.startsWith("/forge");

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-sky-400/30 bg-sky-400/12 text-sky-600 dark:text-sky-300">
            <CircuitBoard className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-xl leading-none sm:text-2xl">
              VeriClaim
            </span>
            <span className="hidden whitespace-nowrap font-mono text-[11px] text-muted-foreground sm:block">
              verifiable MarketSpecs
            </span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-1 lg:flex">
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

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggle />
            <AuthButton />
            {showForgeCta ? (
              <Button asChild variant="court" size="sm" className="whitespace-nowrap">
                <Link href="/forge">Forge</Link>
              </Button>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border/70 bg-background/95 px-4 py-4 shadow-glass backdrop-blur-xl lg:hidden">
          <nav className="grid gap-2">
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
                  className="justify-start"
                >
                  <Link href={item.href} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4 sm:hidden">
            <ThemeToggle />
            <AuthButton />
            {showForgeCta ? (
              <Button asChild variant="court" size="sm">
                <Link href="/forge" onClick={() => setMobileOpen(false)}>
                  Forge
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
