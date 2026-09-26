import type { FC, ReactNode } from "react";

export const inputClass =
  "input-field";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export const FormField: FC<FormFieldProps> = ({ label, error, children }) => {
  return (
    <label className="block space-y-1.5">
      <span className="caption font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
};
