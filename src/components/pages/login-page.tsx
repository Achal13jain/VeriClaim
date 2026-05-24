"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Coins,
  Gavel,
  Loader2,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAuthNotice,
  signInWithDemoAccount,
  signInWithGoogle,
  type AuthAction,
  type AuthNotice,
} from "@/lib/firebase/auth";
import { STARTING_FORGE_CREDITS } from "@/lib/firebase/firestore";

const benefits = [
  {
    icon: Sparkles,
    title: "Save MarketSpecs",
    detail: "Turn generated specs into public pages with shareable hashes.",
  },
  {
    icon: Coins,
    title: "Use Forge Credits",
    detail: `Start with ${STARTING_FORGE_CREDITS} credits after your 3 free Forge runs.`,
  },
  {
    icon: Gavel,
    title: "Challenge specs",
    detail: "Earn reputation by finding ambiguity and resolution flaws.",
  },
  {
    icon: ShieldCheck,
    title: "Publish mock Arc proofs",
    detail: "Record Arc-ready proof metadata while real contract publishing is planned.",
  },
];

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/forge";
  }

  return value;
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<AuthAction | null>(null);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const next = safeNext(searchParams.get("next"));

  async function signIn(action: Extract<AuthAction, "google" | "demo">) {
    setBusy(action);
    setNotice(null);

    try {
      if (action === "google") {
        await signInWithGoogle();
      } else {
        await signInWithDemoAccount();
      }

      router.push(next);
    } catch (caughtError) {
      setNotice(getAuthNotice(caughtError, action));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="page-shell flex min-h-[calc(100vh-4rem)] items-center py-10">
      <section className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">Profile required for actions</Badge>
            <Badge variant="violet">Mock mode ready</Badge>
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Build your VeriClaim profile.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Sign in to forge and save MarketSpecs, spend limited Forge Credits,
            challenge weak specs, track reputation, and publish mock Arc proof
            records.
          </p>
          <div className="rounded-lg border border-border/70 bg-card/60 p-4 text-sm leading-6 text-muted-foreground">
            You can still explore public specs and agents without signing in.
            Actions that write to Firestore or earn rewards require a profile.
          </div>
        </div>

        <div className="glass-panel rounded-lg p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="section-eyebrow">Sign in</p>
              <h2 className="mt-2 font-display text-3xl leading-tight">
                Start with 3 free Forge runs.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                After that, use Forge Credits or a clearly labeled mock x402
                unlock. No real payments move in the MVP.
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                type="button"
                variant="court"
                size="lg"
                disabled={busy !== null}
                onClick={() => signIn("google")}
              >
                {busy === "google" ? <Loader2 className="animate-spin" /> : <LogIn />}
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={busy !== null}
                onClick={() => signIn("demo")}
              >
                {busy === "demo" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <UserRoundPlus />
                )}
                Continue in demo mode
              </Button>
            </div>

            {notice ? (
              <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
                {notice.message}
              </div>
            ) : null}

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-md border border-border/70 bg-background/60 p-3"
                >
                  <benefit.icon className="mb-2 size-4 text-court-blue" />
                  <p className="font-semibold">{benefit.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {benefit.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="size-4 shrink-0" />
              New profiles start with {STARTING_FORGE_CREDITS} Forge Credits.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
