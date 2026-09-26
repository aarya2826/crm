"use client";

import { useEffect, useState } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notify } from "@/lib/toast";
import { updateInstituteName } from "@/app/settings/actions";
import type { InstituteProfile } from "@/app/settings/actions";
import { FormField, inputClass } from "@/components/common/FormField";
import { Spinner } from "@/components/common/Spinner";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/settingsSchema";
import { BatchesManager } from "@/components/Batches/BatchesManager";
import { CoursesManager } from "@/components/Courses/CoursesManager";
import { UsersManager } from "@/components/Settings/UsersManager";
import type { UserRow } from "@/app/users/actions";
import type { BatchDto, CourseDto } from "@/types/academic.types";
import { TemplatesManager } from "@/components/Settings/TemplatesManager";
import type { MessageTemplateDto } from "@/app/templates/actions";

interface SettingsWorkspaceProps {
  profile: InstituteProfile;
  courses: CourseDto[];
  batches: BatchDto[];
  users: UserRow[];
  templates: MessageTemplateDto[];
}

export const SettingsWorkspace: FC<SettingsWorkspaceProps> = ({
  profile,
  courses,
  batches,
  users,
  templates,
}) => {
  const [tab, setTab] = useState<"institute" | "master" | "users" | "templates">("institute");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: profile,
  });

  useEffect(() => {
    reset(profile);
  }, [profile, reset]);

  const logo = watch("logoDataUrl");

  const onSubmit = async (values: SettingsFormValues): Promise<void> => {
    try {
      const result = await updateInstituteName(values);
      if (!result.success) {
        notify.error(result.error ?? "Could not save settings.");
        return;
      }
      notify.success("Institute profile saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      notify.error("Could not save settings.");
    }
  };

  const onLogo = (file: File | undefined): void => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValue("logoDataUrl", String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: "institute" as const, label: "Institute" },
    { id: "master" as const, label: "Master Data" },
    { id: "users" as const, label: "Users" },
    { id: "templates" as const, label: "Communication Templates" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="body-text mt-1">Institute profile, master data, and staff access.</p>
      </div>
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === item.id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "institute" ? (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormField label="Institute Name" error={errors.instituteName?.message}>
            <input {...register("instituteName")} className={inputClass} />
          </FormField>
          <FormField label="Address" error={errors.address?.message}>
            <textarea {...register("address")} className={inputClass} rows={2} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone" error={errors.phone?.message}>
              <input {...register("phone")} className={inputClass} />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <input {...register("email")} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Logo">
            <input type="file" accept="image/*" onChange={(event) => onLogo(event.target.files?.[0])} />
          </FormField>
          {logo ? <img src={logo} alt="Institute logo" className="h-16 object-contain" /> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? <Spinner /> : null}
            Save Settings
          </button>
        </form>
      ) : null}
      {tab === "master" ? (
        <div className="space-y-8">
          <CoursesManager initialCourses={courses} />
          <BatchesManager initialBatches={batches} courses={courses} />
        </div>
      ) : null}
      {tab === "users" ? <UsersManager users={users} /> : null}
      {tab === "templates" ? <TemplatesManager templates={templates} /> : null}
    </section>
  );
};
