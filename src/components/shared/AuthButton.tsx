"use client";

import { useState } from "react";
import {
  AlertCircle,
  Award,
  Info,
  LogIn,
  LogOut,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAuthNotice,
  signInWithDemoAccount,
  signInWithGoogle,
  signOutUser,
  useAuthState,
  type AuthAction,
  type AuthNotice,
} from "@/lib/firebase/auth";
import { getUserLevel } from "@/lib/gamification/rules";
import { cn } from "@/lib/utils";

export function AuthButton() {
  const { configured, loading, user, profile } = useAuthState();
  const [busy, setBusy] = useState<AuthAction | null>(null);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const avatarUrl = profile?.photoURL || user?.photoURL || "";
  const displayName = profile?.displayName || user?.displayName || "User";
  const reputation = profile?.reputation ?? 0;
  const level = getUserLevel(reputation);

  async function run(action: AuthAction) {
    setBusy(action);
    setNotice(null);

    try {
      if (action === "google") {
        await signInWithGoogle();
      } else if (action === "demo") {
        await signInWithDemoAccount();
      } else {
        await signOutUser();
      }
    } catch (caughtError) {
      setNotice(getAuthNotice(caughtError, action));
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
    const NoticeIcon = notice?.tone === "info" ? Info : AlertCircle;

    return (
      <div className="relative flex items-center gap-2">
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
        {notice ? (
          <div
            role={notice.tone === "warning" ? "alert" : "status"}
            aria-live="polite"
            className={cn(
              "absolute right-0 top-[calc(100%+0.5rem)] z-50 flex w-[min(22rem,calc(100vw-2rem))] items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium shadow-glass backdrop-blur-xl",
              notice.tone === "warning"
                ? "border-amber-400/35 bg-background/95 text-amber-700 dark:text-amber-300"
                : "border-sky-400/35 bg-background/95 text-sky-700 dark:text-sky-300",
            )}
          >
            <NoticeIcon className="mt-0.5 size-3.5 shrink-0" />
            <span className="leading-5">{notice.message}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 2xl:flex">
        <Badge variant="glass" className="h-9 gap-1.5 px-3">
          {avatarUrl ? (
            <span
              aria-hidden="true"
              className="size-4 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarUrl})` }}
            />
          ) : (
            <UserRound className="size-3.5" />
          )}
          <span className="max-w-28 truncate">{displayName}</span>
        </Badge>
        <Badge variant="glass" className="h-9 px-3">
          {profile?.credits ?? 100} credits
        </Badge>
        <Badge variant="success" className="h-9 px-3">
          {reputation} rep
        </Badge>
        <Badge variant="violet" className="h-9 gap-1.5 px-3">
          <Award className="size-3.5" />
          <span className="max-w-28 truncate">{level.title}</span>
        </Badge>
        {profile?.badges.slice(0, 1).map((badge) => (
          <Badge key={badge} variant="blue" className="h-9 px-3">
            <span className="max-w-28 truncate">{badge}</span>
          </Badge>
        ))}
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
