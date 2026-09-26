/** SMS/email/WhatsApp stub — logs to the console; no provider keys. */
export interface ReminderPayload {
  channel: "EMAIL" | "SMS";
  to: string;
  body: string;
}

export interface MessagePayload {
  channel: "EMAIL" | "SMS";
  to: string;
  body: string;
}

/**
 * Stub for future WhatsApp/SMS/Email providers.
 * Drop API keys here later without changing call sites.
 */
export function sendReminder(payload: ReminderPayload): void {
  console.log("[messaging stub] reminder", payload);
}

/**
 * Stub for future WhatsApp/SMS/Email providers.
 */
export function sendMessage(payload: MessagePayload): void {
  console.log("[messaging stub] message", payload);
}
