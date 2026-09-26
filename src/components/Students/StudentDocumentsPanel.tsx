"use client";

import { useState } from "react";
import type { FC } from "react";
import { notify } from "@/lib/toast";
import { deleteStudentDocument, uploadStudentDocument } from "@/app/documents/actions";
import type { StudentDocumentDto } from "@/app/documents/actions";
import { formatDate } from "@/lib/formatDate";

interface StudentDocumentsPanelProps {
  studentId: string;
  documents: StudentDocumentDto[];
  canEdit: boolean;
}

export const StudentDocumentsPanel: FC<StudentDocumentsPanelProps> = ({
  studentId,
  documents,
  canEdit,
}) => {
  const [uploading, setUploading] = useState(false);

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("studentId", studentId);
      formData.set("file", file);
      const result = await uploadStudentDocument(formData);
      if (!result.success) {
        notify.error(result.error ?? "Upload failed.");
        return;
      }
      notify.success("Document uploaded");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
        {canEdit ? (
          <label className="cursor-pointer rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700">
            {uploading ? "Uploading…" : "Upload file"}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(event) => {
                void onUpload(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500">ID proof, marksheets, agreements (PDF/images, max 8MB).</p>
      {documents.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No documents uploaded yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{doc.fileName}</p>
                <p className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</p>
              </div>
              <div className="flex gap-2">
                <a href={doc.fileUrl} download className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">
                  Download
                </a>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await deleteStudentDocument(doc.id);
                      if (!result.success) {
                        notify.error(result.error ?? "Could not delete.");
                        return;
                      }
                      notify.success("Document deleted");
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
