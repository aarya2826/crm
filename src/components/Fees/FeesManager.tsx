"use client";

/** Fees list, record payment, history PDFs, and reminders. */

import { useEffect, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import { getStudentPayments, recordPayment, sendFeeReminder } from "@/app/fees/actions";
import { Pagination } from "@/components/common/Pagination";
import type { FeePaymentStatus } from "@/constants/fees";
import { notify } from "@/lib/toast";
import { withTimeout } from "@/lib/withTimeout";
import type { PagedResult } from "@/lib/query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type { PaymentFormValues } from "@/lib/paymentSchema";
import type { InstituteProfile } from "@/app/settings/actions";
import type { CourseDto } from "@/types/academic.types";
import type { StudentFeeRow } from "@/types/fee.types";
import { SearchField } from "@/components/common/SearchField";
import { inputClass } from "@/components/common/FormField";
import { PaymentFormModal } from "./PaymentFormModal";
import { PaymentHistoryModal } from "./PaymentHistoryModal";
import { FeesTable } from "./FeesTable";

interface FeesManagerProps {
  list: PagedResult<StudentFeeRow>;
  search: string;
  courseId: string;
  status: "ALL" | FeePaymentStatus;
  courses: CourseDto[];
  institute: InstituteProfile;
  canRecordPayments: boolean;
}

export const FeesManager: FC<FeesManagerProps> = ({
  list,
  search: initialSearch,
  courseId,
  status,
  courses,
  institute,
  canRecordPayments,
}) => {
  const router = useRouter();
  const { isPending, setFilters } = useUrlFilters();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [payingStudent, setPayingStudent] = useState<StudentFeeRow | null>(null);
  const [historyStudent, setHistoryStudent] = useState<StudentFeeRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (debouncedSearch === initialSearch) {
      return;
    }
    setFilters({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, initialSearch, setFilters]);

  const handlePayment = async (values: PaymentFormValues): Promise<void> => {
    if (!payingStudent) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const result = await withTimeout(recordPayment(payingStudent.studentId, values));
      if (!result.success) {
        setFormError(result.error ?? "Could not save payment.");
        notify.error(result.error ?? "Could not save payment.");
        return;
      }
      notify.success("Payment recorded");
      if (payingStudent.pendingAmount - values.amount <= 0) {
        const { celebrate } = await import("@/lib/celebrate");
        celebrate();
      }
      setPayingStudent(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to record payment:", error);
      setFormError("Could not save payment.");
      notify.error(error instanceof Error ? error.message : "Could not save payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="page-title">Fees</h1>
        <p className="body-text mt-1">
          Track collections, pending dues, and receipts.
        </p>
      </div>
      <div className="surface-card p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <SearchField
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student name"
            aria-label="Search by student name"
          />
          <select
            value={courseId}
            onChange={(event) => setFilters({ courseId: event.target.value, page: 1 })}
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
            value={status}
            onChange={(event) => setFilters({ status: event.target.value, page: 1 })}
            className={inputClass}
          >
            <option value="ALL">All payment statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div className={`mt-5 min-h-[28rem] ${isPending ? "table-busy" : "table-ready"}`} aria-busy={isPending}>
          <FeesTable
            rows={list.rows}
            canRecordPayments={canRecordPayments}
            sortKey={list.sort}
            direction={list.dir}
            onSort={(column) =>
              setFilters({
                sort: column,
                dir: list.sort === column && list.dir === "asc" ? "desc" : "asc",
                page: 1,
              })
            }
            onPay={setPayingStudent}
            onHistory={async (row) => {
              try {
                const payments = await withTimeout(getStudentPayments(row.studentId));
                setHistoryStudent({ ...row, payments });
              } catch (error) {
                notify.error(error instanceof Error ? error.message : "Could not load payment history.");
              }
            }}
            onRemind={
              canRecordPayments
                ? async (row) => {
                    try {
                      const result = await withTimeout(sendFeeReminder(row.studentId));
                      if (!result.success) {
                        notify.error(result.error ?? "Could not send reminder.");
                        return;
                      }
                      notify.success("Reminder logged");
                      router.refresh();
                    } catch (error) {
                      notify.error(error instanceof Error ? error.message : "Could not send reminder.");
                    }
                  }
                : undefined
            }
          />
          <Pagination
            page={list.page}
            totalPages={totalPages}
            onPageChange={(next) => setFilters({ page: next })}
          />
        </div>
      </div>
      <PaymentFormModal
        isOpen={Boolean(payingStudent)}
        student={payingStudent}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={() => {
          setPayingStudent(null);
          setFormError(null);
        }}
        onSubmit={handlePayment}
      />
      <PaymentHistoryModal
        isOpen={Boolean(historyStudent)}
        student={historyStudent}
        institute={institute}
        onClose={() => setHistoryStudent(null)}
      />
    </section>
  );
};
