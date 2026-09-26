"use client";

import { useEffect } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notify } from "@/lib/toast";
import { updateInstituteName } from "@/app/settings/actions";
import { FormField, inputClass } from "@/components/common/FormField";
import { Spinner } from "@/components/common/Spinner";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/settingsSchema";

interface SettingsFormProps {
  instituteName: string;
}

export const SettingsForm: FC<SettingsFormProps> = ({ instituteName }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { instituteName },
  });

  useEffect(() => {
    reset({ instituteName });
  }, [instituteName, reset]);

  const onSubmit = async (values: SettingsFormValues): Promise<void> => {
    try {
      const result = await updateInstituteName(values);
      if (!result.success) {
        notify.error(result.error ?? "Could not save settings.");
        return;
      }
      notify.success("Institute name saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      notify.error("Could not save settings.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          This name appears on PDF receipts and the top header.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <FormField label="Institute Name" error={errors.instituteName?.message}>
          <input {...register("instituteName")} className={inputClass} />
        </FormField>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? <Spinner /> : null}
          Save Settings
        </button>
      </form>
    </section>
  );
};
