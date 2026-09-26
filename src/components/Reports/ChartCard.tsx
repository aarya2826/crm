"use client";

import { useRef } from "react";
import type { FC, ReactNode } from "react";
import { Download } from "lucide-react";

interface ChartCardProps {
  title: string;
  caption?: string;
  children: ReactNode;
  fileName: string;
}

export const ChartCard: FC<ChartCardProps> = ({ title, caption, children, fileName }) => {
  const ref = useRef<HTMLDivElement>(null);

  const download = async (): Promise<void> => {
    if (!ref.current) {
      return;
    }
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(ref.current, { backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="surface-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="card-title">{title}</h2>
          {caption ? <p className="caption mt-1">{caption}</p> : null}
        </div>
        <button type="button" onClick={() => void download()} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600">
          <Download className="h-4 w-4" />
          <span className="sr-only">Download chart</span>
        </button>
      </div>
      <div ref={ref}>{children}</div>
    </div>
  );
};
