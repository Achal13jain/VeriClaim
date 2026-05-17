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

export function firebaseReady() {
  return isFirebaseConfigured();
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

  const profile: UserProfile = {
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

  await setDoc(userRef, profile);
  return profile;
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
  const existing = await getDoc(specRef);

  if (existing.exists()) {
    return {
      hash,
      spec: normalizeSpec(existing.data()),
      alreadyExisted: true,
      agentRunSaved: false,
    };
  }

  const specToSave: MarketSpecRecord = {
    ...spec,
    hash,
    createdBy: user.uid,
    createdAt: nowIso(),
    arcPublished: false,
    arcTxHash: null,
    challengeCount: spec.challengeCount ?? 0,
    rewardTotal: spec.rewardTotal ?? 0,
  };

  await setDoc(specRef, specToSave);
  const agentRunSaved = await saveAgentRunBestEffort(specToSave, user.uid);

  return {
    hash,
    spec: specToSave,
    alreadyExisted: false,
    agentRunSaved,
  };
}
