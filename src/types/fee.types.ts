import type { FeePaymentStatus, PaymentModeValue } from "@/constants/fees";

export interface PaymentDto {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  mode: PaymentModeValue;
  installmentNumber: number;
  notes: string | null;
  createdAt: string;
  invoiceNumber: number | null;
  taxAmount: number;
  nextDueDate: string | null;
}

export interface StudentFeeRow {
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string | null;
  courseId: string;
  courseName: string;
  totalFee: number;
  amountPaid: number;
  pendingAmount: number;
  status: FeePaymentStatus;
  installments: number;
  payments: PaymentDto[];
}
