export const PAYMENT_MODES = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
] as const;

export type PaymentModeValue = (typeof PAYMENT_MODES)[number];

export const PAYMENT_MODE_LABELS: Record<PaymentModeValue, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
};

export type FeePaymentStatus = "PAID" | "PARTIAL" | "PENDING";

export const FEE_STATUS_LABELS: Record<FeePaymentStatus, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
};

export const FEE_STATUS_BADGE: Record<FeePaymentStatus, string> = {
  PAID: "bg-green-50 text-green-800 ring-green-200",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  PENDING: "bg-red-50 text-red-700 ring-red-200",
};
