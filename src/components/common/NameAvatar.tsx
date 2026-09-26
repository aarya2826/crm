import type { FC } from "react";

const PALETTE = ["#4f46e5", "#0d9488", "#7c3aed", "#d97706", "#2563eb", "#db2777", "#0f766e"];

function hashName(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

interface NameAvatarProps {
  name: string;
  size?: "sm" | "md";
}

export const NameAvatar: FC<NameAvatarProps> = ({ name, size = "sm" }) => {
  const color = PALETTE[hashName(name) % PALETTE.length];
  const dim = size === "md" ? "h-9 w-9 text-sm" : "h-8 w-8 text-[11px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${dim}`}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
};
