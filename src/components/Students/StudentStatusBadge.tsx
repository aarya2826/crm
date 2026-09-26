import type { FC } from "react";
import type { StudentStatusValue } from "@/constants/students";
import { STUDENT_STATUS_BADGE_CLASSES, STUDENT_STATUS_LABELS } from "@/constants/students";
import { StatusPill } from "@/components/common/StatusPill";

interface StudentStatusBadgeProps {
  status: StudentStatusValue;
}

export const StudentStatusBadge: FC<StudentStatusBadgeProps> = ({ status }) => {
  return <StatusPill label={STUDENT_STATUS_LABELS[status]} className={STUDENT_STATUS_BADGE_CLASSES[status]} />;
};
