"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  ChevronDown,
  Coins,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  signOutUser,
  useAuthState,
  type AuthAction,
} from "@/lib/firebase/auth";
import { STARTING_FORGE_CREDITS } from "@/lib/firebase/firestore";
import { getUserLevel } from "@/lib/gamification/rules";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "User";
}

function initials(name: string, email: string) {
  const source = name.trim() || email.trim() || "VC";
  const parts = source.split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AuthButton() {
  const { configured, loading, user, profile } = useAuthState();
  const [busy, setBusy] = useState<AuthAction | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const avatarUrl = profile?.photoURL || user?.photoURL || "";
  const displayName = profile?.displayName || user?.displayName || "User";
  const email = profile?.email || user?.email || "";
  const reputation = profile?.reputation ?? 0;
  const credits = profile?.credits ?? STARTING_FORGE_CREDITS;
  const level = getUserLevel(reputation);
  const visibleName = firstName(displayName);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function signOut() {
    setBusy("out");

    try {
      await signOutUser();
      setOpen(false);
    } finally {
      setBusy(null);
    }
  }

  if (!configured) {
    return (
      <Badge variant="warning" className="hidden sm:inline-flex">
        Firebase env missing
      </Badge>
    );
  }

  if (loading) {
    return (
      <Badge variant="glass" className="hidden sm:inline-flex">
        Auth loading
      </Badge>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className="whitespace-nowrap">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={() => setOpen((current) => !current)}
        className="gap-2 whitespace-nowrap pl-2 pr-2.5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {avatarUrl ? (
          <span
            aria-hidden="true"
            className="size-6 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url(${avatarUrl})` }}
          />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-violet-500 text-[11px] font-bold text-white">
            {initials(displayName, email)}
          </span>
        )}
        <span className="hidden max-w-20 truncate lg:inline">{visibleName}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-border/80 bg-background/95 shadow-glass backdrop-blur-xl"
        >
          <div className="border-b border-border/70 p-4">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <span
                  aria-hidden="true"
                  className="size-10 rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url(${avatarUrl})` }}
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-md bg-violet-500 text-sm font-bold text-white">
                  {initials(displayName, email)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {email || "Demo profile"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-md border border-border/70 bg-card/70 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="size-3.5" />
                Credits
              </div>
              <p className="font-mono text-lg">{credits}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-card/70 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Award className="size-3.5" />
                Reputation
              </div>
              <p className="font-mono text-lg">{reputation}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/70 p-3">
            <Badge variant="violet" className="w-full justify-start gap-1.5 py-1.5">
              <BadgeCheck className="size-3.5" />
              {level.title}
            </Badge>
            {profile?.badges?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.badges.slice(0, 4).map((badge) => (
                  <Badge key={badge} variant="blue">
                    {badge}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                Badges unlock as you forge, challenge, and publish proofs.
              </p>
            )}
          </div>

          <div className="grid gap-2 border-t border-border/70 p-3">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <LayoutDashboard />
                Dashboard
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={signOut}
              className="justify-start"
            >
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
