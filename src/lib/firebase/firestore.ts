import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { hashMarketSpec } from "@/lib/utils/hashMarketSpec";
import type { AgentTraceStep, MarketSpecRecord } from "@/lib/types";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  credits: number;
  reputation: number;
  badges: string[];
  createdAt: string;
  lastActiveAt: string;
}

export interface SaveSpecResult {
  hash: string;
  spec: MarketSpecRecord;
  alreadyExisted: boolean;
  agentRunSaved: boolean;
  reputationAwarded: number;
}

function requireDb() {
  const db = getFirebaseDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return db;
}

function nowIso() {
  return new Date().toISOString();
}

function profileFromUser(user: User, timestamp: string): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? (user.isAnonymous ? "Demo user" : "VeriClaim user"),
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    credits: 100,
    reputation: 0,
    badges: [],
    createdAt: timestamp,
    lastActiveAt: timestamp,
  };
}

export function firebaseReady() {
  return isFirebaseConfigured();
}

function isFirebasePermissionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code?: unknown }).code) === "permission-denied"
  );
}

function firestorePermissionMessage(action: string) {
  return `Firestore denied ${action}. Deploy firestore.rules to the same Firebase project used by NEXT_PUBLIC_FIREBASE_PROJECT_ID, then restart the app.`;
}

export function createLocalUserProfile(user: User): UserProfile {
  const timestamp = nowIso();

  return profileFromUser(user, timestamp);
}

export async function getUserProfile(uid: string) {
  if (!firebaseReady()) {
    return null;
  }

  const db = requireDb();
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const db = requireDb();
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const timestamp = nowIso();

  if (snapshot.exists()) {
    await updateDoc(userRef, {
      lastActiveAt: timestamp,
    });

    return {
      ...(snapshot.data() as UserProfile),
      lastActiveAt: timestamp,
    };
  }

  const profile = profileFromUser(user, timestamp);

  await setDoc(userRef, profile);
  return profile;
}

function forgeReputationAward(spec: MarketSpecRecord) {
  return 2 + (spec.judge.verdict === "blessed" || spec.status === "blessed" ? 15 : 0);
}

function normalizeTraceStep(step: unknown): AgentTraceStep {
  const value = step as Partial<AgentTraceStep>;

  return {
    agentId: value.agentId ?? "agent-unknown",
    role: value.role ?? "forger",
    title: value.title ?? "Agent trace",
    summary: value.summary ?? "No trace summary available.",
    status: value.status ?? "complete",
    score: value.score,
  };
}

function normalizeSpec(data: DocumentData): MarketSpecRecord {
  return {
    hash: String(data.hash),
    sourceClaim: String(data.sourceClaim ?? ""),
    canonicalClaim: String(data.canonicalClaim ?? ""),
    sourceType: data.sourceType,
    marketSpec: data.marketSpec,
    critic: data.critic,
    judge: data.judge,
    scores: data.scores,
    agentTrace: Array.isArray(data.agentTrace)
      ? data.agentTrace.map(normalizeTraceStep)
      : [],
    status: data.status,
    createdBy: String(data.createdBy ?? ""),
    createdAt: String(data.createdAt ?? ""),
    arcPublished: Boolean(data.arcPublished),
    arcTxHash: data.arcTxHash ?? null,
    challengeCount: Number(data.challengeCount ?? 0),
    rewardTotal: Number(data.rewardTotal ?? 0),
    requirementIds: Array.isArray(data.requirementIds) ? data.requirementIds : [],
  };
}

export async function listPublicSpecs(max = 50) {
  if (!firebaseReady()) {
    return [];
  }

  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, "specs"), orderBy("createdAt", "desc"), limit(max)),
  );

  return snapshot.docs.map((item) => normalizeSpec(item.data()));
}

export async function getSpecByHash(hash: string) {
  if (!firebaseReady()) {
    return null;
  }

  const db = requireDb();
  const snapshot = await getDoc(doc(db, "specs", hash));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeSpec(snapshot.data());
}

async function saveAgentRunBestEffort(spec: MarketSpecRecord, uid: string) {
  const db = requireDb();

  try {
    await addDoc(collection(db, "agent_runs"), {
      specHash: spec.hash,
      forgerOutput: spec.agentTrace[0] ?? null,
      criticOutput: spec.agentTrace[1] ?? null,
      judgeOutput: spec.agentTrace[2] ?? null,
      modelsUsed: {},
      createdBy: uid,
      createdAt: nowIso(),
    });

    return true;
  } catch {
    return false;
  }
}

export async function saveMarketSpec(spec: MarketSpecRecord, user: User): Promise<SaveSpecResult> {
  const db = requireDb();
  const hash = await hashMarketSpec(spec);
  const specRef = doc(db, "specs", hash);
  const userRef = doc(db, "users", user.uid);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(specRef);
      const createdAt = nowIso();
      const userSnapshot = await transaction.get(userRef);
      const baseProfile = userSnapshot.exists()
        ? {
            ...profileFromUser(user, createdAt),
            ...(userSnapshot.data() as Partial<UserProfile>),
          }
        : profileFromUser(user, createdAt);

      if (existing.exists()) {
        transaction.set(
          userRef,
          {
            ...baseProfile,
            uid: user.uid,
            lastActiveAt: createdAt,
          },
          { merge: true },
        );

        return {
          hash,
          spec: normalizeSpec(existing.data()),
          alreadyExisted: true,
          reputationAwarded: 0,
        };
      }

      const specToSave: MarketSpecRecord = {
        ...spec,
        hash,
        createdBy: user.uid,
        createdAt,
        arcPublished: false,
        arcTxHash: null,
        challengeCount: 0,
        rewardTotal: 0,
      };

      const reputationAwarded = forgeReputationAward(specToSave);

      transaction.set(specRef, specToSave);
      transaction.set(
        userRef,
        {
          ...baseProfile,
          uid: user.uid,
          displayName: baseProfile.displayName,
          email: baseProfile.email,
          photoURL: baseProfile.photoURL,
          credits: Number(baseProfile.credits ?? 100),
          reputation: Number(baseProfile.reputation ?? 0) + reputationAwarded,
          badges: Array.isArray(baseProfile.badges) ? baseProfile.badges : [],
          lastActiveAt: createdAt,
        },
        { merge: true },
      );

      return {
        hash,
        spec: specToSave,
        alreadyExisted: false,
        reputationAwarded,
      };
    });

    const agentRunSaved = result.alreadyExisted
      ? false
      : await saveAgentRunBestEffort(result.spec, user.uid);

    return {
      ...result,
      agentRunSaved,
    };
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      throw new Error(firestorePermissionMessage("saving this MarketSpec"));
    }

    throw error;
  }
}
