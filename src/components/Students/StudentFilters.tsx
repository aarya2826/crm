import type { FC } from "react";
import { SearchField } from "@/components/common/SearchField";
import { inputClass } from "@/components/common/FormField";
import {
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
  type StudentStatusValue,
} from "@/constants/students";
import type { BatchDto, CourseDto } from "@/types/academic.types";

interface StudentFiltersProps {
  search: string;
  courseId: string;
  batchId: string;
  status: "ALL" | StudentStatusValue;
  courses: CourseDto[];
  batches: BatchDto[];
  onSearchChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onBatchChange: (value: string) => void;
  onStatusChange: (value: "ALL" | StudentStatusValue) => void;
}

export const StudentFilters: FC<StudentFiltersProps> = ({
  search,
  courseId,
  batchId,
  status,
  courses,
  batches,
  onSearchChange,
  onCourseChange,
  onBatchChange,
  onStatusChange,
}) => {
  const filteredBatches = courseId
    ? batches.filter((batch) => batch.courseId === courseId)
    : batches;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SearchField
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or phone"
        aria-label="Search students"
      />
      <select
        value={courseId}
        onChange={(event) => {
          onCourseChange(event.target.value);
          onBatchChange("");
        }}
        className={inputClass}
      >
        <option value="">All courses</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>
      <select
        value={batchId}
        onChange={(event) => onBatchChange(event.target.value)}
        className={inputClass}
      >
        <option value="">All batches</option>
        {filteredBatches.map((batch) => (
          <option key={batch.id} value={batch.id}>
            {batch.name}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as "ALL" | StudentStatusValue)
        }
        className={inputClass}
      >
        <option value="ALL">All statuses</option>
        {STUDENT_STATUSES.map((item) => (
          <option key={item} value={item}>
            {STUDENT_STATUS_LABELS[item]}
          </option>
        ))}
      </select>
    </div>
  );
};
