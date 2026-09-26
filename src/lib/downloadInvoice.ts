import { jsPDF } from "jspdf";
import { PAYMENT_MODE_LABELS } from "@/constants/fees";
import { formatCurrency, formatDate } from "@/lib/formatDate";
import type { PaymentDto } from "@/types/fee.types";

export function formatInvoiceNumber(invoiceNumber: number): string {
  return `INV-${String(invoiceNumber).padStart(4, "0")}`;
}

export function downloadPaymentInvoice(options: {
  instituteName: string;
  address?: string;
  phone?: string;
  email?: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string | null;
  courseName: string;
  payment: PaymentDto;
}): void {
  const {
    instituteName,
    address,
    phone,
    email,
    studentName,
    studentPhone,
    studentEmail,
    courseName,
    payment,
  } = options;
  const doc = new jsPDF();
  const invoiceLabel = payment.invoiceNumber
    ? formatInvoiceNumber(payment.invoiceNumber)
    : payment.id;
  const tax = payment.taxAmount ?? 0;
  const total = payment.amount + tax;

  doc.setFontSize(18);
  doc.text(instituteName, 20, 22);
  doc.setFontSize(10);
  let y = 28;
  if (address) {
    doc.text(address, 20, y);
    y += 5;
  }
  if (phone) {
    doc.text(`Phone: ${phone}`, 20, y);
    y += 5;
  }
  if (email) {
    doc.text(`Email: ${email}`, 20, y);
    y += 5;
  }

  doc.setFontSize(14);
  doc.text("TAX INVOICE", 20, y + 8);
  doc.setFontSize(11);
  doc.text(`Invoice No: ${invoiceLabel}`, 130, 22);
  doc.text(`Date: ${formatDate(payment.paymentDate)}`, 130, 28);

  doc.setLineWidth(0.4);
  doc.line(20, y + 12, 190, y + 12);

  let cursor = y + 22;
  doc.setFontSize(11);
  doc.text("Bill to", 20, cursor);
  cursor += 6;
  doc.text(studentName, 20, cursor);
  cursor += 5;
  if (studentPhone) {
    doc.text(studentPhone, 20, cursor);
    cursor += 5;
  }
  if (studentEmail) {
    doc.text(studentEmail, 20, cursor);
    cursor += 5;
  }

  cursor += 8;
  doc.text(`Course: ${courseName}`, 20, cursor);
  cursor += 6;
  doc.text(`Mode: ${PAYMENT_MODE_LABELS[payment.mode]}`, 20, cursor);
  cursor += 6;
  doc.text(`Installment: ${payment.installmentNumber}`, 20, cursor);
  cursor += 12;

  doc.text("Description", 20, cursor);
  doc.text("Amount", 160, cursor);
  cursor += 2;
  doc.line(20, cursor, 190, cursor);
  cursor += 8;
  doc.text(`Course fee installment #${payment.installmentNumber}`, 20, cursor);
  doc.text(formatCurrency(payment.amount), 160, cursor);
  cursor += 8;
  doc.text("Tax", 20, cursor);
  doc.text(formatCurrency(tax), 160, cursor);
  cursor += 2;
  doc.line(20, cursor + 4, 190, cursor + 4);
  cursor += 12;
  doc.setFontSize(12);
  doc.text("Total", 20, cursor);
  doc.text(formatCurrency(total), 160, cursor);

  if (payment.nextDueDate) {
    cursor += 14;
    doc.setFontSize(11);
    doc.text(`Next installment due: ${formatDate(payment.nextDueDate)}`, 20, cursor);
  }

  cursor += 20;
  doc.setFontSize(9);
  doc.text("This is a system-generated invoice.", 20, cursor);
  doc.save(`invoice-${invoiceLabel.toLowerCase()}.pdf`);
}
