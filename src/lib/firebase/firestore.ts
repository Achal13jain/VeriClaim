import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type {
  ChallengeReasonCategory,
  ChallengeResponse,
} from "@/lib/challenges/schemas";
import {
  calculateChallengeReward,
  calculateForgeReward,
  defaultUserStats,
  getEarnedBadges,
  getUserLevel,
  type UserStats,
} from "@/lib/gamification/rules";
import { hashMarketSpec } from "@/lib/utils/hashMarketSpec";
import type {
  ActivityEvent,
  AgentTraceStep,
  LeaderboardUser,
  MarketSpecRecord,
} from "@/lib/types";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  credits: number;
  reputation: number;
  badges: string[];
  stats: UserStats;
  activityHistory: ProfileActivity[];
  createdAt: string;
  lastActiveAt: string;
}

export interface ProfileActivity {
  id: string;
  type: "forge" | "challenge" | "proof" | "reward";
  title: string;
  detail: string;
  creditDelta: number;
  reputationDelta: number;
  createdAt: string;
}

export interface SaveSpecResult {
  hash: string;
  spec: MarketSpecRecord;
  alreadyExisted: boolean;
  agentRunSaved: boolean;
  reputationAwarded: number;
  creditAwarded: number;
  badgesAwarded: string[];
}

export interface SaveChallengeResult {
  challengeId: string;
  updatedSpec: MarketSpecRecord;
  creditDelta: number;
  reputationDelta: number;
  badgesAwarded: string[];
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
    stats: { ...defaultUserStats },
    activityHistory: [],
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

function normalizeUserStats(value: unknown): UserStats {
  const stats = value as Partial<UserStats>;

  return {
    forges: Number(stats?.forges ?? 0),
    blessedSpecs: Number(stats?.blessedSpecs ?? 0),
    challenges: Number(stats?.challenges ?? 0),
    successfulChallenges: Number(stats?.successfulChallenges ?? 0),
    arcProofs: Number(stats?.arcProofs ?? 0),
  };
}

function normalizeActivityHistory(value: unknown): ProfileActivity[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 12).map((item) => {
    const activity = item as Partial<ProfileActivity>;

    return {
      id: String(activity.id ?? crypto.randomUUID()),
      type: activity.type ?? "forge",
      title: String(activity.title ?? "VeriClaim activity"),
      detail: String(activity.detail ?? ""),
      creditDelta: Number(activity.creditDelta ?? 0),
      reputationDelta: Number(activity.reputationDelta ?? 0),
      createdAt: String(activity.createdAt ?? nowIso()),
    };
  });
}

function normalizeUserProfile(data: DocumentData): UserProfile {
  return {
    uid: String(data.uid ?? ""),
    displayName: String(data.displayName ?? "VeriClaim user"),
    email: String(data.email ?? ""),
    photoURL: String(data.photoURL ?? ""),
    credits: Number(data.credits ?? 100),
    reputation: Number(data.reputation ?? 0),
    badges: Array.isArray(data.badges) ? data.badges.map(String) : [],
    stats: normalizeUserStats(data.stats),
    activityHistory: normalizeActivityHistory(data.activityHistory),
    createdAt: String(data.createdAt ?? ""),
    lastActiveAt: String(data.lastActiveAt ?? ""),
  };
}

function mergeBadges(currentBadges: string[], nextStats: UserStats) {
  const badgeSet = new Set([...currentBadges, ...getEarnedBadges(nextStats)]);

  return Array.from(badgeSet);
}

function profileActivity(
  type: ProfileActivity["type"],
  title: string,
  detail: string,
  creditDelta: number,
  reputationDelta: number,
  createdAt: string,
): ProfileActivity {
  return {
    id: crypto.randomUUID(),
    type,
    title,
    detail,
    creditDelta,
    reputationDelta,
    createdAt,
  };
}

function updateProfileActivity(
  profile: UserProfile,
  activity: ProfileActivity,
) {
  return [activity, ...profile.activityHistory].slice(0, 12);
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

  return normalizeUserProfile(snapshot.data());
}

export function subscribeToUserProfile(
  uid: string,
  onProfile: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
) {
  if (!firebaseReady()) {
    onProfile(null);
    return () => {};
  }

  const db = requireDb();

  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      onProfile(snapshot.exists() ? normalizeUserProfile(snapshot.data()) : null);
    },
    (error) => {
      onError?.(error);
    },
  );
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
      ...normalizeUserProfile(snapshot.data()),
      lastActiveAt: timestamp,
    };
  }

  const profile = profileFromUser(user, timestamp);

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

function normalizeActivityEvent(id: string, data: DocumentData): ActivityEvent {
  return {
    id,
    title: String(data.title ?? "VeriClaim activity"),
    detail: String(data.detail ?? ""),
    timestamp: new Date(String(data.createdAt ?? nowIso())).toLocaleDateString(
      "en",
      {
        month: "short",
        day: "numeric",
      },
    ),
    type: data.type ?? "forge",
  };
}

function profileToLeaderboardUser(profile: UserProfile): LeaderboardUser {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    credits: profile.credits,
    reputation: profile.reputation,
    level: getUserLevel(profile.reputation).title,
    badges: profile.badges,
    blessedSpecs: profile.stats.blessedSpecs,
    challenges: profile.stats.challenges,
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

export async function listTopUsers(max = 10) {
  if (!firebaseReady()) {
    return [];
  }

  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, "users"), orderBy("reputation", "desc"), limit(max)),
  );

  return snapshot.docs
    .map((item) => profileToLeaderboardUser(normalizeUserProfile(item.data())))
    .filter((user) => user.uid);
}

export async function listRecentActivityEvents(max = 8) {
  if (!firebaseReady()) {
    return [];
  }

  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, "activity_events"), orderBy("createdAt", "desc"), limit(max)),
  );

  return snapshot.docs.map((item) =>
    normalizeActivityEvent(item.id, item.data()),
  );
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

export async function saveChallengeCourtResult({
  spec,
  user,
  challengeReason,
  reasonCategory,
  ruling,
}: {
  spec: MarketSpecRecord;
  user: User;
  challengeReason: string;
  reasonCategory: ChallengeReasonCategory;
  ruling: ChallengeResponse;
}): Promise<SaveChallengeResult> {
  const db = requireDb();
  const specRef = doc(db, "specs", spec.hash);
  const userRef = doc(db, "users", user.uid);
  const challengeRef = doc(collection(db, "challenges"));
  const activityRef = doc(collection(db, "activity_events"));

  try {
    return await runTransaction(db, async (transaction) => {
      const specSnapshot = await transaction.get(specRef);

      if (!specSnapshot.exists()) {
        throw new Error("Save this MarketSpec before challenging it.");
      }

      const userSnapshot = await transaction.get(userRef);
      const createdAt = nowIso();
      const currentSpec = normalizeSpec(specSnapshot.data());
      const baseProfile = userSnapshot.exists()
        ? normalizeUserProfile(userSnapshot.data())
        : profileFromUser(user, createdAt);
      const reward = calculateChallengeReward(ruling.ruling);
      const successful = ruling.ruling !== "rejected";
      const nextStats = {
        ...baseProfile.stats,
        challenges: baseProfile.stats.challenges + 1,
        successfulChallenges: successful
          ? baseProfile.stats.successfulChallenges + 1
          : baseProfile.stats.successfulChallenges,
      };
      const nextBadges = mergeBadges(baseProfile.badges, nextStats);
      const badgesAwarded = nextBadges.filter(
        (badge) => !baseProfile.badges.includes(badge),
      );
      const nextStatus =
        ruling.ruling === "needs_revision"
          ? "needs_revision"
          : ruling.ruling === "accepted"
            ? "challenged"
            : currentSpec.status;
      const updatedSpec: MarketSpecRecord = {
        ...currentSpec,
        status: nextStatus,
        challengeCount: currentSpec.challengeCount + 1,
        rewardTotal: currentSpec.rewardTotal + reward.creditsDelta,
      };
      const activity = profileActivity(
        "challenge",
        successful ? "Challenge accepted" : "Challenge rejected",
        ruling.summary,
        reward.creditsDelta,
        reward.reputationDelta,
        createdAt,
      );

      transaction.update(specRef, {
        status: updatedSpec.status,
        challengeCount: updatedSpec.challengeCount,
        rewardTotal: updatedSpec.rewardTotal,
      });
      transaction.set(challengeRef, {
        specHash: spec.hash,
        challengerUid: user.uid,
        challengeReason,
        reasonCategory,
        ruling: ruling.ruling,
        summary: ruling.summary,
        reasoning: ruling.reasoning,
        suggestedQuestion: ruling.suggested_question,
        suggestedResolutionRule: ruling.suggested_resolution_rule,
        creditDelta: reward.creditsDelta,
        reputationDelta: reward.reputationDelta,
        createdAt,
      });
      transaction.set(
        userRef,
        {
          ...baseProfile,
          uid: user.uid,
          credits: Math.max(0, baseProfile.credits + reward.creditsDelta),
          reputation: Math.max(
            0,
            baseProfile.reputation + reward.reputationDelta,
          ),
          badges: nextBadges,
          stats: nextStats,
          activityHistory: updateProfileActivity(baseProfile, activity),
          lastActiveAt: createdAt,
        },
        { merge: true },
      );
      transaction.set(activityRef, {
        actorUid: user.uid,
        specHash: spec.hash,
        challengeId: challengeRef.id,
        type: "challenge",
        title: successful ? "Challenge accepted" : "Challenge rejected",
        detail: ruling.summary,
        creditDelta: reward.creditsDelta,
        reputationDelta: reward.reputationDelta,
        createdAt,
      });

      return {
        challengeId: challengeRef.id,
        updatedSpec,
        creditDelta: reward.creditsDelta,
        reputationDelta: reward.reputationDelta,
        badgesAwarded,
      };
    });
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      throw new Error(firestorePermissionMessage("saving this challenge"));
    }

    throw error;
  }
}

export async function saveMarketSpec(spec: MarketSpecRecord, user: User): Promise<SaveSpecResult> {
  const db = requireDb();
  const hash = await hashMarketSpec(spec);
  const specRef = doc(db, "specs", hash);
  const userRef = doc(db, "users", user.uid);
  const activityRef = doc(collection(db, "activity_events"));

  try {
    const result = await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(specRef);
      const createdAt = nowIso();
      const userSnapshot = await transaction.get(userRef);
      const baseProfile = userSnapshot.exists()
        ? normalizeUserProfile(userSnapshot.data())
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
          creditAwarded: 0,
          badgesAwarded: [],
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

      const reward = calculateForgeReward(specToSave.status);
      const nextStats = {
        ...baseProfile.stats,
        forges: baseProfile.stats.forges + 1,
        blessedSpecs:
          specToSave.status === "blessed" || specToSave.status === "published"
            ? baseProfile.stats.blessedSpecs + 1
            : baseProfile.stats.blessedSpecs,
        arcProofs: specToSave.arcPublished
          ? baseProfile.stats.arcProofs + 1
          : baseProfile.stats.arcProofs,
      };
      const nextBadges = mergeBadges(baseProfile.badges, nextStats);
      const badgesAwarded = nextBadges.filter(
        (badge) => !baseProfile.badges.includes(badge),
      );
      const activity = profileActivity(
        "forge",
        "MarketSpec forged",
        specToSave.marketSpec.question,
        reward.creditsDelta,
        reward.reputationDelta,
        createdAt,
      );

      transaction.set(specRef, specToSave);
      transaction.set(
        userRef,
        {
          ...baseProfile,
          uid: user.uid,
          displayName: baseProfile.displayName,
          email: baseProfile.email,
          photoURL: baseProfile.photoURL,
          credits: baseProfile.credits + reward.creditsDelta,
          reputation: Math.max(
            0,
            baseProfile.reputation + reward.reputationDelta,
          ),
          badges: nextBadges,
          stats: nextStats,
          activityHistory: updateProfileActivity(baseProfile, activity),
          lastActiveAt: createdAt,
        },
        { merge: true },
      );
      transaction.set(activityRef, {
        actorUid: user.uid,
        specHash: hash,
        type: "forge",
        title: "MarketSpec forged",
        detail: specToSave.marketSpec.question,
        creditDelta: reward.creditsDelta,
        reputationDelta: reward.reputationDelta,
        createdAt,
      });

      return {
        hash,
        spec: specToSave,
        alreadyExisted: false,
        reputationAwarded: reward.reputationDelta,
        creditAwarded: reward.creditsDelta,
        badgesAwarded,
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
