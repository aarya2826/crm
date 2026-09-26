"use client";

import { useState } from "react";
import type { FC } from "react";
import { notify } from "@/lib/toast";
import { deleteMessageTemplate, upsertMessageTemplate } from "@/app/templates/actions";
import type { MessageTemplateDto } from "@/app/templates/actions";

interface TemplatesManagerProps {
  templates: MessageTemplateDto[];
}

export const TemplatesManager: FC<TemplatesManagerProps> = ({ templates }) => {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = (): void => {
    setName("");
    setBody("");
    setEditingId(null);
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const result = await upsertMessageTemplate({
        id: editingId ?? undefined,
        name,
        body,
      });
      if (!result.success) {
        notify.error(result.error ?? "Could not save template.");
        return;
      }
      notify.success("Template saved");
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-3 surface-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <h2 className="text-sm font-semibold text-slate-900">
          {editingId ? "Edit template" : "New template"}
        </h2>
        <p className="text-xs text-slate-500">
          Placeholders: {"{studentName}"}, {"{amount}"}, {"{dueDate}"}, {"{courseName}"}
        </p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Template name"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save template"}
          </button>
          {editingId ? (
            <button type="button" onClick={reset} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
              Cancel
            </button>
          ) : null}
        </div>
      </form>
      <ul className="space-y-3">
        {templates.map((template) => (
          <li key={template.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-medium text-slate-900">{template.name}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{template.body}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(template.id);
                  setName(template.name);
                  setBody(template.body);
                }}
                className="text-xs font-medium text-brand-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  const result = await deleteMessageTemplate(template.id);
                  if (!result.success) {
                    notify.error(result.error ?? "Could not delete.");
                    return;
                  }
                  notify.success("Template deleted");
                }}
                className="text-xs font-medium text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
