"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  createLocalUserProfile,
  ensureUserProfile,
  getUserProfile,
  subscribeToUserProfile,
  type UserProfile,
} from "@/lib/firebase/firestore";

export interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
}

export type AuthAction = "google" | "demo" | "out";

export interface AuthNotice {
  tone: "info" | "warning";
  message: string;
}

function getFirebaseAuthCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code);
  }

  return "";
}

export function getAuthNotice(error: unknown, action: AuthAction): AuthNotice {
  const code = getFirebaseAuthCode(error);

  if (code === "auth/popup-closed-by-user") {
    return {
      tone: "info",
      message: "Sign-in cancelled. No account was connected.",
    };
  }

  if (code === "auth/cancelled-popup-request") {
    return {
      tone: "info",
      message: "A newer sign-in popup was opened. Continue with that window.",
    };
  }

  if (code === "auth/popup-blocked") {
    return {
      tone: "warning",
      message: "Popup blocked. Allow popups for this site, then try again.",
    };
  }

  if (code === "auth/unauthorized-domain") {
    return {
      tone: "warning",
      message:
        "This domain is not authorized in Firebase Auth. Add it under Authorized domains.",
    };
  }

  if (
    code === "auth/admin-restricted-operation" ||
    code === "auth/operation-not-allowed"
  ) {
    return {
      tone: "warning",
      message:
        action === "demo"
          ? "Demo sign-in is not enabled. Enable Anonymous sign-in in Firebase Auth, or use Google sign-in."
          : "This sign-in provider is not enabled for this Firebase project.",
    };
  }

  if (code === "auth/network-request-failed") {
    return {
      tone: "warning",
      message: "Network issue during sign-in. Check your connection and retry.",
    };
  }

  if (action === "out") {
    return {
      tone: "warning",
      message: "Could not sign out. Please try again.",
    };
  }

  return {
    tone: "warning",
    message: "Sign-in failed. Please try again.",
  };
}

async function ensureProfileBestEffort(user: User) {
  try {
    return await ensureUserProfile(user);
  } catch (error) {
    console.warn(
      "Firebase Auth succeeded, but Firestore blocked the user profile write. Falling back to a local profile until rules are deployed.",
      error,
    );

    return createLocalUserProfile(user);
  }
}

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    configured: isFirebaseConfigured(),
    loading: true,
    user: null,
    profile: null,
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubscribeProfile: (() => void) | undefined;

    if (!auth) {
      setState({
        configured: false,
        loading: false,
        user: null,
        profile: null,
      });
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (!user) {
        setState({
          configured: true,
          loading: false,
          user: null,
          profile: null,
        });
        return;
      }

      const profile = await ensureProfileBestEffort(user);
      setState({
        configured: true,
        loading: false,
        user,
        profile,
      });

      unsubscribeProfile = subscribeToUserProfile(
        user.uid,
        (nextProfile) => {
          setState({
            configured: true,
            loading: false,
            user,
            profile: nextProfile ?? profile,
          });
        },
        (error) => {
          console.warn("Could not subscribe to user profile.", error);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  return state;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase is not configured.");
  }

  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureProfileBestEffort(result.user);
  return result.user;
}

export async function signInWithDemoAccount() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase is not configured.");
  }

  const result = await signInAnonymously(auth);
  await ensureProfileBestEffort(result.user);
  return result.user;
}

export async function signOutUser() {
  const auth = getFirebaseAuth();

  if (!auth) {
    return;
  }

  await signOut(auth);
}

export async function refreshUserProfile(uid: string) {
  return getUserProfile(uid);
}
