"use client";

import { useEffect } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, inputClass } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { Spinner } from "@/components/common/Spinner";
import { PAYMENT_MODES, PAYMENT_MODE_LABELS } from "@/constants/fees";
import { toDateInputValue } from "@/lib/formatDate";
import { paymentFormSchema, type PaymentFormValues } from "@/lib/paymentSchema";
import type { StudentFeeRow } from "@/types/fee.types";

interface PaymentFormModalProps {
  isOpen: boolean;
  student: StudentFeeRow | null;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}

export const PaymentFormModal: FC<PaymentFormModalProps> = ({
  isOpen,
  student,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentDate: toDateInputValue(),
      mode: "UPI",
      installmentNumber: 1,
      notes: "",
      taxAmount: 0,
    },
  });

  useEffect(() => {
    if (!isOpen || !student) {
      return;
    }

    reset({
      amount: student.pendingAmount || student.totalFee,
      paymentDate: toDateInputValue(),
      mode: "UPI",
      installmentNumber: student.payments.length + 1,
      notes: "",
      taxAmount: 0,
    });
  }, [isOpen, student, reset]);

  return (
    <Modal isOpen={isOpen} title="Record Payment" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-500">
          {student ? `${student.studentName} · Pending ${student.pendingAmount}` : null}
        </p>
        <FormField label="Amount" error={errors.amount?.message}>
          <input
            type="number"
            min={1}
            {...register("amount", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField label="Payment Date" error={errors.paymentDate?.message}>
          <input type="date" {...register("paymentDate")} className={inputClass} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Mode" error={errors.mode?.message}>
            <select {...register("mode")} className={inputClass}>
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {PAYMENT_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Installment Number" error={errors.installmentNumber?.message}>
            <input
              type="number"
              min={1}
              {...register("installmentNumber", { valueAsNumber: true })}
              className={inputClass}
            />
          </FormField>
        </div>
        <FormField label="Tax (optional)" error={errors.taxAmount?.message}>
          <input
            type="number"
            min={0}
            {...register("taxAmount", {
              setValueAs: (value: string) => {
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : 0;
              },
            })}
            className={inputClass}
          />
        </FormField>
        <FormField label="Notes" error={errors.notes?.message}>
          <textarea {...register("notes")} rows={2} className={inputClass} />
        </FormField>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? <Spinner /> : null}
            Save Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};
