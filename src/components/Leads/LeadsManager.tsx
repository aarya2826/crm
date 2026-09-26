"use client";

/** Leads list, filters, bulk bar, create/edit/convert modals. */

import { useEffect, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import {
  bulkAssignLeads,
  bulkDeleteLeads,
  bulkUpdateLeadStatus,
  createLead,
  deleteLead,
  updateLead,
} from "@/app/leads/actions";
import { convertLeadToStudent } from "@/app/students/actions";
import { BulkBar } from "@/components/common/BulkBar";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Pagination } from "@/components/common/Pagination";
import type { LeadStatusValue } from "@/constants/leads";
import { LEAD_STATUSES, STATUS_LABELS } from "@/constants/leads";
import { exportRowsToExcel } from "@/lib/exportExcel";
import { celebrate } from "@/lib/celebrate";
import { notify } from "@/lib/toast";
import { withTimeout } from "@/lib/withTimeout";
import type { ScoreBand } from "@/lib/leadScore";
import type { LeadFormValues } from "@/lib/leadSchema";
import type { PagedResult } from "@/lib/query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type { ConvertLeadFormValues } from "@/lib/studentSchema";
import type { UserPermissions } from "@/constants/roles";
import type { BatchDto, CourseDto } from "@/types/academic.types";
import type { LeadDto } from "@/types/lead.types";
import type { StaffOption } from "@/types/crm.types";
import { ConvertLeadModal } from "./ConvertLeadModal";
import { LeadFilters } from "./LeadFilters";
import { LeadFormModal } from "./LeadFormModal";
import { LeadTable } from "./LeadTable";

interface LeadsManagerProps {
  list: PagedResult<LeadDto>;
  search: string;
  status: "ALL" | LeadStatusValue;
  score: "ALL" | ScoreBand;
  courses: CourseDto[];
  batches: BatchDto[];
  permissions: UserPermissions;
  staff: StaffOption[];
  openCreate?: boolean;
}

export const LeadsManager: FC<LeadsManagerProps> = ({
  list,
  search: initialSearch,
  status,
  score: scoreFilter,
  courses,
  batches,
  permissions,
  staff,
  openCreate = false,
}) => {
  const router = useRouter();
  const { isPending, setFilters } = useUrlFilters();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCounselorId, setBulkCounselorId] = useState("");
  const [bulkStatus, setBulkStatus] = useState<LeadStatusValue>("NEW");
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadDto | null>(null);
  const [convertingLead, setConvertingLead] = useState<LeadDto | null>(null);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LeadDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (debouncedSearch === initialSearch) {
      return;
    }
    setFilters({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, initialSearch, setFilters]);

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  const openCreateModal = (): void => {
    setEditingLead(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (openCreate) {
      openCreateModal();
    }
  }, [openCreate]);

  const openEditModal = (lead: LeadDto): void => {
    setEditingLead(lead);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingLead(null);
    setFormError(null);
  };

  const handleSubmit = async (values: LeadFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await withTimeout(
        editingLead ? updateLead(editingLead.id, values) : createLead(values)
      );

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        notify.error(result.error ?? "Something went wrong.");
        return;
      }

      notify.success(editingLead ? "Lead updated" : "Lead created");
      closeModal();
      router.refresh();
    } catch (error) {
      console.error("Lead form submit failed:", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeConvertModal = (): void => {
    setIsConvertOpen(false);
    setConvertingLead(null);
    setFormError(null);
  };

  const handleConvertSubmit = async (
    values: ConvertLeadFormValues
  ): Promise<void> => {
    if (!convertingLead) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await withTimeout(convertLeadToStudent(convertingLead.id, values));
      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        notify.error(result.error ?? "Something went wrong.");
        return;
      }

      notify.success("Lead converted to student");
      celebrate();
      closeConvertModal();
      router.refresh();
    } catch (error) {
      console.error("Lead conversion failed:", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await withTimeout(deleteLead(pendingDelete.id));
      if (!result.success) {
        notify.error(result.error ?? "Could not delete lead.");
        setPendingDelete(null);
        return;
      }

      notify.success("Lead deleted");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete lead:", error);
      notify.error(error instanceof Error ? error.message : "Could not delete lead. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="body-text mt-1">
            Track, filter, and manage incoming leads.
          </p>
        </div>
        {permissions.canEditLeads ? (
          <Button type="button" onClick={openCreateModal}>
            Add New Lead
          </Button>
        ) : null}
      </div>
      <div className="surface-card p-5">
        <LeadFilters
          search={search}
          status={status}
          score={scoreFilter}
          onSearchChange={setSearch}
          onStatusChange={(value) => setFilters({ status: value, page: 1 })}
          onScoreChange={(value) => setFilters({ score: value, page: 1 })}
        />
        <div className={`mt-5 min-h-[28rem] ${isPending ? "table-busy" : "table-ready"}`} aria-busy={isPending}>
          <BulkBar count={selectedIds.length}>
            <select
              value={bulkCounselorId}
              onChange={(event) => setBulkCounselorId(event.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              <option value="">Counselor</option>
              {staff
                .filter((person) => person.role === "COUNSELOR" || person.role === "ADMIN")
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="rounded-md bg-white px-2 py-1 text-xs font-medium text-brand-700"
              onClick={async () => {
                const result = await withTimeout(bulkAssignLeads(selectedIds, bulkCounselorId || null));
                if (!result.success) {
                  notify.error(result.error ?? "Could not assign.");
                  return;
                }
                notify.success("Counselor assigned");
                setSelectedIds([]);
                router.refresh();
              }}
            >
              Assign
            </button>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as LeadStatusValue)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              {LEAD_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABELS[item]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-md bg-white px-2 py-1 text-xs font-medium text-brand-700"
              onClick={async () => {
                const result = await withTimeout(bulkUpdateLeadStatus(selectedIds, bulkStatus));
                if (!result.success) {
                  notify.error(result.error ?? "Could not update.");
                  return;
                }
                notify.success("Status updated");
                setSelectedIds([]);
                router.refresh();
              }}
            >
              Change status
            </button>
            <button
              type="button"
              className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700"
              onClick={() => {
                const rows = list.rows
                  .filter((lead) => selectedIds.includes(lead.id))
                  .map((lead) => [lead.name, lead.phone, lead.email ?? "", lead.source, lead.status, lead.score]);
                void exportRowsToExcel("leads-selected", "Leads", ["Name", "Phone", "Email", "Source", "Status", "Score"], rows);
              }}
            >
              Export Excel
            </button>
            {permissions.canDelete ? (
              <button
                type="button"
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-red-600"
                onClick={() => setPendingBulkDelete(true)}
              >
                Delete
              </button>
            ) : null}
          </BulkBar>
          <LeadTable
            leads={list.rows}
            canEdit={permissions.canEditLeads}
            canDelete={permissions.canDelete}
            canConvert={permissions.canEditStudents}
            sortKey={list.sort}
            direction={list.dir}
            onSort={(column) =>
              setFilters({
                sort: column,
                dir: list.sort === column && list.dir === "asc" ? "desc" : "asc",
                page: 1,
              })
            }
            onAdd={permissions.canEditLeads ? openCreateModal : undefined}
            onEdit={openEditModal}
            onDelete={setPendingDelete}
            selectedIds={selectedIds}
            onToggle={(id) =>
              setSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
              )
            }
            onToggleAll={(ids) =>
              setSelectedIds((current) =>
                ids.every((id) => current.includes(id))
                  ? current.filter((id) => !ids.includes(id))
                  : Array.from(new Set([...current, ...ids]))
              )
            }
            onConvert={(lead) => {
              setIsModalOpen(false);
              setConvertingLead(lead);
              setFormError(null);
              setIsConvertOpen(true);
            }}
          />
          <Pagination
            page={list.page}
            totalPages={totalPages}
            onPageChange={(next) => setFilters({ page: next })}
          />
        </div>
      </div>
      <LeadFormModal
        isOpen={isModalOpen}
        lead={editingLead}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <ConvertLeadModal
        isOpen={isConvertOpen}
        lead={convertingLead}
        courses={courses}
        batches={batches}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={closeConvertModal}
        onSubmit={handleConvertSubmit}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete lead"
        message={`Are you sure you want to delete this lead${pendingDelete ? ` "${pendingDelete.name}"` : ""}?`}
        isLoading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        isOpen={pendingBulkDelete}
        title="Delete selected leads"
        message={`Delete ${selectedIds.length} selected lead(s)? This cannot be undone.`}
        isLoading={isDeleting}
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            const result = await withTimeout(bulkDeleteLeads(selectedIds));
            if (!result.success) {
              notify.error(result.error ?? "Could not delete.");
              return;
            }
            notify.success("Leads deleted");
            setPendingBulkDelete(false);
            setSelectedIds([]);
            router.refresh();
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </section>
  );
};
