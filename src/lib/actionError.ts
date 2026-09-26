import type { ActionResult } from "@/types/lead.types";

export function fail(error: unknown, fallback: string): ActionResult {
  console.error(fallback, error);
  return { success: false, error: fallback };
}
