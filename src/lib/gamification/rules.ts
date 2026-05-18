import type { MarketSpecStatus } from "@/lib/types";

export type ChallengeRuling = "accepted" | "rejected" | "needs_revision";

export interface RewardDelta {
  creditsDelta: number;
  reputationDelta: number;
}

export interface UserStats {
  forges: number;
  blessedSpecs: number;
  challenges: number;
  successfulChallenges: number;
  arcProofs: number;
}

export interface UserLevel {
  title: string;
  min: number;
  max: number | null;
}

export const defaultUserStats: UserStats = {
  forges: 0,
  blessedSpecs: 0,
  challenges: 0,
  successfulChallenges: 0,
  arcProofs: 0,
};

export function calculateForgeReward(verdict: MarketSpecStatus): RewardDelta {
  const verdictBonus: Record<MarketSpecStatus, number> = {
    blessed: 15,
    published: 15,
    needs_revision: 5,
    rejected: -3,
    challenged: 0,
  };

  return {
    creditsDelta: 0,
    reputationDelta: 2 + verdictBonus[verdict],
  };
}

export function calculateChallengeReward(ruling: ChallengeRuling): RewardDelta {
  if (ruling === "rejected") {
    return {
      creditsDelta: 0,
      reputationDelta: -2,
    };
  }

  return {
    creditsDelta: 5,
    reputationDelta: 10,
  };
}

export function calculateArcProofReward(): RewardDelta {
  return {
    creditsDelta: 0,
    reputationDelta: 20,
  };
}

export function getUserLevel(reputation: number): UserLevel {
  if (reputation >= 600) {
    return { title: "Spec Master", min: 600, max: null };
  }
  if (reputation >= 300) {
    return { title: "Trusted Validator", min: 300, max: 599 };
  }
  if (reputation >= 150) {
    return { title: "Ambiguity Hunter", min: 150, max: 299 };
  }
  if (reputation >= 50) {
    return { title: "Market Architect", min: 50, max: 149 };
  }

  return { title: "Novice Forger", min: 0, max: 49 };
}

export function getEarnedBadges(userStats: UserStats) {
  const badges = new Set<string>();

  if (userStats.forges >= 1) {
    badges.add("First Forge");
  }
  if (userStats.blessedSpecs >= 1) {
    badges.add("First Blessed Spec");
  }
  if (userStats.challenges >= 1) {
    badges.add("First Challenge");
  }
  if (userStats.successfulChallenges >= 3) {
    badges.add("Ambiguity Hunter");
  }
  if (userStats.forges >= 5) {
    badges.add("Market Architect");
  }
  if (userStats.arcProofs >= 1) {
    badges.add("First Arc Proof");
  }
  if (userStats.blessedSpecs >= 5) {
    badges.add("Blessed x5");
  }
  if (userStats.successfulChallenges >= 5) {
    badges.add("Top Critic");
  }

  return Array.from(badges);
}
