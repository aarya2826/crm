import type { FC } from "react";
import { scoreBand } from "@/lib/leadScore";

interface ScoreBadgeProps {
  score: number;
}

const BAND_CLASS = {
  HOT: "bg-red-50 text-red-700 ring-red-200",
  WARM: "bg-amber-50 text-amber-800 ring-amber-200",
  COLD: "bg-sky-50 text-sky-700 ring-sky-200",
} as const;

const BAND_LABEL = {
  HOT: "Hot",
  WARM: "Warm",
  COLD: "Cold",
} as const;

export const ScoreBadge: FC<ScoreBadgeProps> = ({ score }) => {
  const band = scoreBand(score);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${BAND_CLASS[band]}`}>
      {BAND_LABEL[band]}
      <span className="font-normal text-[11px] opacity-80">{score}</span>
    </span>
  );
};
