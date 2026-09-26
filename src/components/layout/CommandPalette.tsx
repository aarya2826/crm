"use client";

import { useEffect, useMemo, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { getLeadsPage } from "@/app/leads/actions";
import { getStudentsPage } from "@/app/students/actions";
import { NAV_ACCESS } from "@/constants/roles";
import type { AppRole } from "@/constants/roles";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { inputClass } from "@/components/common/FormField";

interface CommandPaletteProps {
  role: AppRole;
}

export const CommandPalette: FC<CommandPaletteProps> = ({ role }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [leadHits, setLeadHits] = useState<Array<{ id: string; name: string }>>([]);
  const [studentHits, setStudentHits] = useState<Array<{ id: string; name: string }>>([]);
  const pages = useMemo(() => NAV_ACCESS.filter((item) => item.roles.includes(role)), [role]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || debounced.trim().length < 2) {
      setLeadHits([]);
      setStudentHits([]);
      return;
    }
    let active = true;
    Promise.all([
      getLeadsPage({ search: debounced, page: "1" }),
      getStudentsPage({ search: debounced, page: "1" }),
    ])
      .then(([leads, students]) => {
        if (!active) {
          return;
        }
        setLeadHits(leads.rows.slice(0, 5).map((row) => ({ id: row.id, name: row.name })));
        setStudentHits(students.rows.slice(0, 5).map((row) => ({ id: row.id, name: row.name })));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [debounced, open]);

  if (!open) {
    return null;
  }

  const go = (href: string): void => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-start justify-center bg-slate-900/40 p-4 pt-24" onClick={() => setOpen(false)}>
      <div className="modal-panel w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or jump…"
            className={`${inputClass} pl-9`}
          />
        </div>
        <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto text-sm">
          <li>
            <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-brand-50" onClick={() => go("/leads?new=1")}>
              Add Lead
            </button>
          </li>
          <li>
            <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-brand-50" onClick={() => go("/students?new=1")}>
              Add Student
            </button>
          </li>
          {pages.map((item) => (
            <li key={item.href}>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => go(item.href)}>
                Go to {item.label}
              </button>
            </li>
          ))}
          {leadHits.map((lead) => (
            <li key={lead.id}>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" onClick={() => go(`/leads/${lead.id}`)}>
                Lead · {lead.name}
              </button>
            </li>
          ))}
          {studentHits.map((student) => (
            <li key={student.id}>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" onClick={() => go(`/students/${student.id}`)}>
                Student · {student.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="caption mt-3">Ctrl/Cmd + K</p>
      </div>
    </div>
  );
};
