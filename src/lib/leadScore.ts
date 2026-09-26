import type { LeadSourceValue } from "@/constants/leads";

export type ScoreBand = "HOT" | "WARM" | "COLD";

const SOURCE_POINTS: Record<LeadSourceValue, number> = {
  REFERRAL: 40,
  WALK_IN: 25,
  SOCIAL_MEDIA: 20,
  WEBSITE: 15,
};

export function scoreBand(score: number): ScoreBand {
  if (score >= 70) {
    return "HOT";
  }
  if (score >= 40) {
    return "WARM";
  }
  return "COLD";
}

export function calculateLeadScore(input: {
  source: LeadSourceValue;
  activityCount: number;
  lastContactAt: Date | null;
}): number {
  const sourcePoints = SOURCE_POINTS[input.source] ?? 15;
  const engagementPoints = Math.min(input.activityCount * 8, 40);
  let recencyPoints = 0;
  if (input.lastContactAt) {
    const days = (Date.now() - input.lastContactAt.getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 3) {
      recencyPoints = 20;
    } else if (days <= 7) {
      recencyPoints = 14;
    } else if (days <= 14) {
      recencyPoints = 8;
    } else if (days <= 30) {
      recencyPoints = 4;
    }
  }
  return Math.min(100, sourcePoints + engagementPoints + recencyPoints);
}
