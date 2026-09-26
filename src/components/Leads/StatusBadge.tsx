import type { FC } from "react";
import type { LeadStatusValue } from "@/constants/leads";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/constants/leads";
import { StatusPill } from "@/components/common/StatusPill";

interface StatusBadgeProps {
  status: LeadStatusValue;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  return <StatusPill label={STATUS_LABELS[status]} className={STATUS_BADGE_CLASSES[status]} />;
};
