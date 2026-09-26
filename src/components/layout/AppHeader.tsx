import Link from "next/link";
import type { FC } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/leads", label: "Leads" },
  { href: "/courses", label: "Courses" },
  { href: "/batches", label: "Batches" },
  { href: "/students", label: "Students" },
];

export const AppHeader: FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          CRM
        </Link>
        <nav className="flex flex-wrap items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};
