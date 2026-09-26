"use client";

import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notify } from "@/lib/toast";
import { logActivity } from "@/app/activities/actions";
import { FormField, inputClass } from "@/components/common/FormField";
import { ACTIVITY_LABELS, ACTIVITY_TYPES } from "@/constants/activity";
import { activityFormSchema } from "@/lib/activitySchema";
import type { ActivityFormValues } from "@/lib/activitySchema";

interface LogActivityFormProps {
  leadId?: string;
  studentId?: string;
}

export const LogActivityForm: FC<LogActivityFormProps> = ({ leadId, studentId }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: { type: "NOTE", description: "", leadId, studentId },
  });

  const onSubmit = async (values: ActivityFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      const result = await logActivity({ ...values, leadId, studentId });
      if (!result.success) {
        notify.error(result.error ?? "Could not log activity.");
        return;
      }
      notify.success("Activity logged");
      reset({ type: "NOTE", description: "", leadId, studentId });
      router.refresh();
    } catch (error) {
      console.error(error);
      notify.error("Could not log activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-900">Log activity</p>
      <FormField label="Type" error={errors.type?.message}>
        <select className={inputClass} {...register("type")}>
          {ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACTIVITY_LABELS[type]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="What happened?" error={errors.description?.message}>
        <textarea className={inputClass} rows={3} {...register("description")} />
      </FormField>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : "Add to timeline"}
      </button>
    </form>
  );
};
