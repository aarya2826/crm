"use client";

import { useMemo, useState } from "react";
import type { FC } from "react";
import { notify } from "@/lib/toast";
import type { MessageTemplateDto } from "@/app/templates/actions";
import { sendTemplatedMessage } from "@/app/messages/actions";
import { Modal } from "@/components/common/Modal";
import { applyTemplate } from "@/lib/applyTemplate";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MessageTemplateDto[];
  leadId?: string;
  studentId?: string;
  values: Record<string, string>;
  to: string;
}

export const SendMessageModal: FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  templates,
  leadId,
  studentId,
  values,
  to,
}) => {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [channel, setChannel] = useState<"EMAIL" | "SMS">("SMS");
  const [sending, setSending] = useState(false);

  const selected = templates.find((item) => item.id === templateId) ?? templates[0];
  const preview = useMemo(
    () => (selected ? applyTemplate(selected.body, values) : ""),
    [selected, values]
  );

  const send = async (): Promise<void> => {
    setSending(true);
    try {
      const result = await sendTemplatedMessage({
        leadId,
        studentId,
        channel,
        body: preview,
      });
      if (!result.success) {
        notify.error(result.error ?? "Could not send.");
        return;
      }
      notify.success("Message logged (delivery stub)");
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Send message" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">To: {to}</p>
        <label className="block text-sm">
          Template
          <select
            value={selected?.id ?? ""}
            onChange={(event) => setTemplateId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Channel
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value as "EMAIL" | "SMS")}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </select>
        </label>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Preview</p>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{preview}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={sending || !preview}
            onClick={() => void send()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
