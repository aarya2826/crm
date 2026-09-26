import type { FC, InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { inputClass } from "./FormField";

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {}

export const SearchField: FC<SearchFieldProps> = ({ className = "", ...props }) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input {...props} className={`${inputClass} pl-9`} />
    </div>
  );
};
