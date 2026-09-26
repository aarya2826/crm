"use client";

import { useMemo, useRef, useState } from "react";

export type SortDirection = "asc" | "desc";

export function useTableSort<T>(
  rows: T[],
  initialKey: string,
  getValue: (row: T, key: string) => string | number
): {
  rows: T[];
  sortKey: string;
  direction: SortDirection;
  toggleSort: (key: string) => void;
} {
  const [sortKey, setSortKey] = useState(initialKey);
  const [direction, setDirection] = useState<SortDirection>("asc");
  const getValueRef = useRef(getValue);
  getValueRef.current = getValue;

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((left, right) => {
      const a = getValueRef.current(left, sortKey);
      const b = getValueRef.current(right, sortKey);
      if (typeof a === "number" && typeof b === "number") {
        return direction === "asc" ? a - b : b - a;
      }
      const result = String(a).localeCompare(String(b), "en", { sensitivity: "base" });
      return direction === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sortKey, direction]);

  const toggleSort = (key: string): void => {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("asc");
  };

  return { rows: sorted, sortKey, direction, toggleSort };
}
