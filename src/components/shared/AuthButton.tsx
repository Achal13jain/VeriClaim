"use client";

import { useState } from "react";
import { LogIn, LogOut, UserRound, UserRoundPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  signInWithDemoAccount,
  signInWithGoogle,
  signOutUser,
  useAuthState,
} from "@/lib/firebase/auth";

export function AuthButton() {
  const { configured, loading, user, profile } = useAuthState();
  const [busy, setBusy] = useState<"google" | "demo" | "out" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "google" | "demo" | "out") {
    setBusy(action);
    setError(null);

    try {
      if (action === "google") {
        await signInWithGoogle();
      } else if (action === "demo") {
        await signInWithDemoAccount();
      } else {
        await signOutUser();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Authentication failed.",
      );
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
      <div className="flex items-center gap-2">
        {error ? (
          <Badge variant="warning" className="hidden xl:inline-flex">
            {error}
          </Badge>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("demo")}
          className="hidden sm:inline-flex"
        >
          <UserRoundPlus />
          Demo
        </Button>
        <Button
          type="button"
          variant="court"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("google")}
        >
          <LogIn />
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 xl:flex">
        <Badge variant="glass" className="gap-1.5">
          <UserRound className="size-3.5" />
          {profile?.displayName || user.displayName || "User"}
        </Badge>
        <Badge variant="glass">{profile?.credits ?? 100} credits</Badge>
        <Badge variant="success">{profile?.reputation ?? 0} rep</Badge>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={() => run("out")}
      >
        <LogOut />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}
