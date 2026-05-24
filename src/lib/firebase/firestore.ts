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
  where,
  type DocumentData,
} from "firebase/firestore";

import type { ArcProofRecord } from "@/lib/arc/types";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type {
  ChallengeReasonCategory,
  ChallengeResponse,
} from "@/lib/challenges/schemas";
import {
  calculateArcProofReward,
  calculateChallengeReward,
  calculateForgeReward,
  defaultUserStats,
  getEarnedBadges,
  getUserLevel,
  type UserStats,
} from "@/lib/gamification/rules";
import { createForgeCreditPayment } from "@/lib/payments/mockPayment";
import { FREE_FORGE_LIMIT, type PaymentRecord } from "@/lib/payments/types";
import { hashMarketSpec } from "@/lib/utils/hashMarketSpec";
import { slugify } from "@/lib/utils/slugify";
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
  freeForgeUsed: number;
  totalMockPayments: number;
  totalCreditsSpent: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface ProfileActivity {
  id: string;
  type: "forge" | "challenge" | "proof" | "reward" | "payment";
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

export interface PublishArcProofResult {
  updatedSpec: MarketSpecRecord;
  reputationAwarded: number;
  creditAwarded: number;
  badgesAwarded: string[];
  alreadyPublished: boolean;
}

export interface ForgeUnlockResult {
  payment?: PaymentRecord;
  freeForgeUsed: number;
  creditsRemaining: number;
}

interface PersistArcProofInput {
  spec: MarketSpecRecord;
  user: User;
  proof: ArcProofRecord;
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
    freeForgeUsed: 0,
    totalMockPayments: 0,
    totalCreditsSpent: 0,
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
    freeForgeUsed: Number(data.freeForgeUsed ?? 0),
    totalMockPayments: Number(data.totalMockPayments ?? 0),
    totalCreditsSpent: Number(data.totalCreditsSpent ?? 0),
    createdAt: String(data.createdAt ?? ""),
    lastActiveAt: String(data.lastActiveAt ?? ""),
  };
}

function normalizePaymentRecord(
  id: string,
  data: DocumentData,
): PaymentRecord {
  return {
    id,
    userId: String(data.userId ?? data.uid ?? ""),
    type: "forge_unlock",
    mode: data.mode === "forge_credit" ? "forge_credit" : "mock_x402",
    amountUsd: Number(data.amountUsd ?? data.amount ?? 0),
    creditsSpent: Number(data.creditsSpent ?? 0),
    txReference: String(data.txReference ?? id),
    status: "completed",
    createdAt: String(data.createdAt ?? nowIso()),
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
    const profile = normalizeUserProfile(snapshot.data());

    await updateDoc(userRef, {
      credits: Math.max(0, profile.credits),
      reputation: Math.max(0, profile.reputation),
      badges: profile.badges,
      stats: profile.stats,
      activityHistory: profile.activityHistory,
      freeForgeUsed: profile.freeForgeUsed,
      totalMockPayments: profile.totalMockPayments,
      totalCreditsSpent: profile.totalCreditsSpent,
      lastActiveAt: timestamp,
    });

    return {
      ...profile,
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
    slug: typeof data.slug === "string" ? data.slug : undefined,
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
    arcPublishedAt: data.arcPublishedAt ?? null,
    arcMode: data.arcMode ?? null,
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

export async function listUserPayments(uid: string, max = 8) {
  if (!firebaseReady()) {
    return [];
  }

  const db = requireDb();
  const snapshot = await getDocs(
    query(
      collection(db, "payments"),
      where("userId", "==", uid),
      limit(max),
    ),
  );

  return snapshot.docs
    .map((item) => normalizePaymentRecord(item.id, item.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

async function persistArcProofResult({
  spec,
  user,
  proof,
}: PersistArcProofInput): Promise<PublishArcProofResult> {
  const db = requireDb();
  const specRef = doc(db, "specs", spec.hash);
  const userRef = doc(db, "users", user.uid);
  const proofRef = doc(collection(db, "arc_proofs"));
  const activityRef = doc(collection(db, "activity_events"));

  if (proof.publishedBy !== user.uid || proof.specHash !== spec.hash) {
    throw new Error("Arc proof metadata does not match the signed-in user or spec.");
  }

  try {
    return await runTransaction(db, async (transaction) => {
      const specSnapshot = await transaction.get(specRef);

      if (!specSnapshot.exists()) {
        throw new Error("Save this MarketSpec before publishing an Arc proof.");
      }

      const userSnapshot = await transaction.get(userRef);
      const createdAt = proof.createdAt || nowIso();
      const currentSpec = normalizeSpec(specSnapshot.data());
      const updatedSpec: MarketSpecRecord = {
        ...currentSpec,
        status: "published",
        arcPublished: true,
        arcTxHash: currentSpec.arcPublished ? currentSpec.arcTxHash : proof.txHash,
        arcPublishedAt: currentSpec.arcPublished
          ? currentSpec.arcPublishedAt
          : createdAt,
        arcMode: currentSpec.arcPublished ? currentSpec.arcMode : proof.mode,
      };
      const baseProfile = userSnapshot.exists()
        ? normalizeUserProfile(userSnapshot.data())
        : profileFromUser(user, createdAt);

      if (currentSpec.arcPublished) {
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
          updatedSpec,
          reputationAwarded: 0,
          creditAwarded: 0,
          badgesAwarded: [],
          alreadyPublished: true,
        };
      }

      const reward = calculateArcProofReward();
      const nextStats = {
        ...baseProfile.stats,
        arcProofs: baseProfile.stats.arcProofs + 1,
      };
      const nextBadges = mergeBadges(baseProfile.badges, nextStats);
      const badgesAwarded = nextBadges.filter(
        (badge) => !baseProfile.badges.includes(badge),
      );
      const activity = profileActivity(
        "proof",
        proof.mode === "mock" ? "Mock Arc proof published" : "Arc proof published",
        currentSpec.marketSpec.question,
        reward.creditsDelta,
        reward.reputationDelta,
        createdAt,
      );

      transaction.update(specRef, {
        status: "published",
        arcPublished: true,
        arcTxHash: proof.txHash,
        arcPublishedAt: createdAt,
        arcMode: proof.mode,
      });
      transaction.set(proofRef, {
        specHash: spec.hash,
        chainId: proof.chainId,
        chainName: proof.chainName,
        contractAddress: proof.contractAddress ?? null,
        txHash: proof.txHash,
        mode: proof.mode,
        publishedBy: user.uid,
        createdAt,
      });
      transaction.set(
        userRef,
        {
          ...baseProfile,
          uid: user.uid,
          reputation: Math.max(
            0,
            baseProfile.reputation + reward.reputationDelta,
          ),
          credits: Math.max(0, baseProfile.credits + reward.creditsDelta),
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
        type: "proof",
        title: proof.mode === "mock" ? "Mock Arc proof published" : "Arc proof published",
        detail: currentSpec.marketSpec.question,
        creditDelta: reward.creditsDelta,
        reputationDelta: reward.reputationDelta,
        txHash: proof.txHash,
        mode: proof.mode,
        createdAt,
      });

      return {
        updatedSpec,
        reputationAwarded: reward.reputationDelta,
        creditAwarded: reward.creditsDelta,
        badgesAwarded,
        alreadyPublished: false,
      };
    });
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      throw new Error(firestorePermissionMessage("saving this Arc proof"));
    }

    throw error;
  }
}

export async function publishMockArcProofResult({
  spec,
  user,
  proof,
}: PersistArcProofInput): Promise<PublishArcProofResult> {
  return persistArcProofResult({ spec, user, proof });
}

export async function publishArcProofResult({
  spec,
  user,
  txHash,
  chainId,
  contractAddress,
}: {
  spec: MarketSpecRecord;
  user: User;
  txHash: string;
  chainId: number;
  contractAddress: string;
}): Promise<PublishArcProofResult> {
  return persistArcProofResult({
    spec,
    user,
    proof: {
      specHash: spec.hash,
      chainId,
      chainName: "Arc Testnet",
      contractAddress,
      txHash: txHash as `0x${string}`,
      mode: "contract",
      publishedBy: user.uid,
      createdAt: nowIso(),
    },
  });
}

export async function consumeFreeForgeUse(user: User): Promise<ForgeUnlockResult> {
  const db = requireDb();
  const userRef = doc(db, "users", user.uid);

  try {
    return await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const createdAt = nowIso();
      const baseProfile = userSnapshot.exists()
        ? normalizeUserProfile(userSnapshot.data())
        : profileFromUser(user, createdAt);

      if (baseProfile.freeForgeUsed >= FREE_FORGE_LIMIT) {
        throw new Error("Free forge limit reached.");
      }

      const nextFreeForgeUsed = baseProfile.freeForgeUsed + 1;

      transaction.set(
        userRef,
        {
          ...baseProfile,
          uid: user.uid,
          freeForgeUsed: nextFreeForgeUsed,
          lastActiveAt: createdAt,
        },
        { merge: true },
      );

      return {
        freeForgeUsed: nextFreeForgeUsed,
        creditsRemaining: baseProfile.credits,
      };
    });
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      throw new Error(firestorePermissionMessage("tracking this free forge"));
    }

    throw error;
  }
}

export async function spendForgeCreditForUnlock(
  user: User,
): Promise<ForgeUnlockResult> {
  const db = requireDb();
  const userRef = doc(db, "users", user.uid);
  const paymentRef = doc(collection(db, "payments"));
  const activityRef = doc(collection(db, "activity_events"));

  try {
    return await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const createdAt = nowIso();
      const baseProfile = userSnapshot.exists()
        ? normalizeUserProfile(userSnapshot.data())
        : profileFromUser(user, createdAt);

      if (baseProfile.credits < 1) {
        throw new Error("You need at least 1 Forge Credit for this unlock.");
      }

      const payment = {
        ...createForgeCreditPayment(user.uid),
        createdAt,
      };
      const activity = profileActivity(
        "payment",
        "Forge Credit spent",
        "Unlocked one premium MarketSpec generation.",
        -payment.creditsSpent,
        0,
        createdAt,
      );
      const creditsRemaining = Math.max(0, baseProfile.credits - 1);

      transaction.set(paymentRef, payment);
      transaction.set(
        userRef,
        {
          ...baseProfile,
          uid: user.uid,
          credits: creditsRemaining,
          totalCreditsSpent:
            baseProfile.totalCreditsSpent + payment.creditsSpent,
          activityHistory: updateProfileActivity(baseProfile, activity),
          lastActiveAt: createdAt,
        },
        { merge: true },
      );
      transaction.set(activityRef, {
        actorUid: user.uid,
        type: "payment",
        title: "Forge Credit spent",
        detail: "Unlocked one premium MarketSpec generation.",
        creditDelta: -payment.creditsSpent,
        reputationDelta: 0,
        txReference: payment.txReference,
        mode: payment.mode,
        createdAt,
      });

      return {
        payment,
        freeForgeUsed: baseProfile.freeForgeUsed,
        creditsRemaining,
      };
    });
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      throw new Error(firestorePermissionMessage("spending this Forge Credit"));
    }

    throw error;
  }
}

export async function saveMockPaymentUnlock(
  user: User,
  payment: PaymentRecord,
): Promise<ForgeUnlockResult> {
  const db = requireDb();
  const userRef = doc(db, "users", user.uid);
  const paymentRef = doc(collection(db, "payments"));
  const activityRef = doc(collection(db, "activity_events"));

  if (payment.userId !== user.uid || payment.mode !== "mock_x402") {
    throw new Error("Mock x402 receipt does not match the signed-in user.");
  }

  try {
    return await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const createdAt = payment.createdAt || nowIso();
      const baseProfile = userSnapshot.exists()
        ? normalizeUserProfile(userSnapshot.data())
        : profileFromUser(user, createdAt);
      const activity = profileActivity(
        "payment",
        "Mock x402 payment completed",
        "Unlocked one premium MarketSpec generation.",
        0,
        0,
        createdAt,
      );

      transaction.set(paymentRef, {
        ...payment,
        status: "completed",
        createdAt,
      });
      transaction.set(
        userRef,
        {
          ...baseProfile,
          uid: user.uid,
          totalMockPayments: baseProfile.totalMockPayments + 1,
          activityHistory: updateProfileActivity(baseProfile, activity),
          lastActiveAt: createdAt,
        },
        { merge: true },
      );
      transaction.set(activityRef, {
        actorUid: user.uid,
        type: "payment",
        title: "Mock x402 payment completed",
        detail: "Unlocked one premium MarketSpec generation.",
        creditDelta: 0,
        reputationDelta: 0,
        txReference: payment.txReference,
        mode: payment.mode,
        createdAt,
      });

      return {
        payment,
        freeForgeUsed: baseProfile.freeForgeUsed,
        creditsRemaining: baseProfile.credits,
      };
    });
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      throw new Error(firestorePermissionMessage("saving this mock payment"));
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
        slug: spec.slug ?? slugify(spec.marketSpec.question),
        createdBy: user.uid,
        createdAt,
        arcPublished: false,
        arcTxHash: null,
        arcPublishedAt: null,
        arcMode: null,
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
