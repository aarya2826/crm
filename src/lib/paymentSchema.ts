import { z } from "zod";
import { PAYMENT_MODES } from "@/constants/fees";

export const paymentFormSchema = z.object({
  amount: z.number().int().min(1, "Amount must be at least 1"),
  paymentDate: z.string().min(1, "Payment date is required"),
  mode: z.enum(PAYMENT_MODES),
  installmentNumber: z.number().int().min(1, "Installment must be at least 1"),
  notes: z.string().optional(),
  taxAmount: z.number().int().min(0),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
