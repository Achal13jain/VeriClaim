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
  ensureUserProfile,
  getUserProfile,
  type UserProfile,
} from "@/lib/firebase/firestore";

export interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
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

    if (!auth) {
      setState({
        configured: false,
        loading: false,
        user: null,
        profile: null,
      });
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({
          configured: true,
          loading: false,
          user: null,
          profile: null,
        });
        return;
      }

      const profile = await ensureUserProfile(user);
      setState({
        configured: true,
        loading: false,
        user,
        profile,
      });
    });
  }, []);

  return state;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase is not configured.");
  }

  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signInWithDemoAccount() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase is not configured.");
  }

  const result = await signInAnonymously(auth);
  await ensureUserProfile(result.user);
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
