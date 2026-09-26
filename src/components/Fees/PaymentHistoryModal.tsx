import type { FC } from "react";
import { Modal } from "@/components/common/Modal";
import { PAYMENT_MODE_LABELS } from "@/constants/fees";
import { downloadPaymentInvoice } from "@/lib/downloadInvoice";
import { downloadPaymentReceipt } from "@/lib/downloadReceipt";
import { formatCurrency, formatDate } from "@/lib/formatDate";
import type { InstituteProfile } from "@/app/settings/actions";
import type { StudentFeeRow } from "@/types/fee.types";

interface PaymentHistoryModalProps {
  isOpen: boolean;
  student: StudentFeeRow | null;
  institute: InstituteProfile;
  onClose: () => void;
}

export const PaymentHistoryModal: FC<PaymentHistoryModalProps> = ({
  isOpen,
  student,
  institute,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} title="Payment History" onClose={onClose} wide>
      {!student || student.payments.length === 0 ? (
        <p className="text-sm text-slate-500">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Mode</th>
                <th className="px-3 py-3">Installment</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3 text-right">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {student.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-3 py-3">{formatDate(payment.paymentDate)}</td>
                  <td className="px-3 py-3">{formatCurrency(payment.amount)}</td>
                  <td className="px-3 py-3">{PAYMENT_MODE_LABELS[payment.mode]}</td>
                  <td className="px-3 py-3">{payment.installmentNumber}</td>
                  <td className="px-3 py-3 text-slate-500">{payment.notes || "—"}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          downloadPaymentReceipt({
                            instituteName: institute.instituteName,
                            studentName: student.studentName,
                            courseName: student.courseName,
                            payment,
                            address: institute.address,
                            phone: institute.phone,
                          })
                        }
                        className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Download Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadPaymentInvoice({
                            instituteName: institute.instituteName,
                            address: institute.address,
                            phone: institute.phone,
                            email: institute.email,
                            studentName: student.studentName,
                            studentPhone: student.studentPhone,
                            studentEmail: student.studentEmail,
                            courseName: student.courseName,
                            payment,
                          })
                        }
                        className="rounded-md px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                      >
                        Download Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};
