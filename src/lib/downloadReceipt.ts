import { jsPDF } from "jspdf";
import { PAYMENT_MODE_LABELS } from "@/constants/fees";
import { formatCurrency, formatDate } from "@/lib/formatDate";
import type { PaymentDto } from "@/types/fee.types";

export function downloadPaymentReceipt(options: {
  instituteName: string;
  studentName: string;
  courseName: string;
  payment: PaymentDto;
  address?: string;
  phone?: string;
}): void {
  const { instituteName, studentName, courseName, payment, address, phone } = options;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(instituteName, 20, 24);
  doc.setFontSize(10);
  if (address) {
    doc.text(address, 20, 30);
  }
  if (phone) {
    doc.text(phone, 20, 36);
  }
  doc.setFontSize(12);
  doc.text("Fee Payment Receipt", 20, 46);
  doc.setLineWidth(0.4);
  doc.line(20, 48, 190, 48);

  doc.setFontSize(11);
  const lines = [
    `Receipt ID: ${payment.id}`,
    `Student: ${studentName}`,
    `Course: ${courseName}`,
    `Amount: ${formatCurrency(payment.amount)}`,
    `Date: ${formatDate(payment.paymentDate)}`,
    `Mode: ${PAYMENT_MODE_LABELS[payment.mode]}`,
    `Installment: ${payment.installmentNumber}`,
    payment.notes ? `Notes: ${payment.notes}` : "",
  ].filter(Boolean);

  lines.forEach((line, index) => {
    doc.text(line, 20, 60 + index * 10);
  });

  doc.text("This is a system-generated receipt.", 20, 140);
  doc.save(`receipt-${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
