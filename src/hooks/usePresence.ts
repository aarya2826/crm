"use client";

import { useEffect, useState } from "react";

export function usePresence(isOpen: boolean, durationMs = 180): {
  shown: boolean;
  leaving: boolean;
} {
  const [shown, setShown] = useState(isOpen);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShown(true);
      setLeaving(false);
      return;
    }
    if (!shown) {
      return;
    }
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setShown(false);
      setLeaving(false);
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, shown, durationMs]);

  return { shown, leaving };
}
