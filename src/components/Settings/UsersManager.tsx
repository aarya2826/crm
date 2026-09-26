"use client";

import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/toast";
import { createUser, toggleUserActive } from "@/app/users/actions";
import type { UserRow } from "@/app/users/actions";
import { ROLE_LABELS } from "@/constants/roles";
import type { AppRole } from "@/constants/roles";
import { FormField, inputClass } from "@/components/common/FormField";

interface UsersManagerProps {
  users: UserRow[];
}

export const UsersManager: FC<UsersManagerProps> = ({ users }) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("COUNSELOR");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (): Promise<void> => {
    setSaving(true);
    try {
      const result = await createUser({ name, email, password, role });
      if (!result.success) {
        notify.error(result.error ?? "Could not add user.");
        return;
      }
      notify.success("Staff user added");
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user: UserRow): Promise<void> => {
    const result = await toggleUserActive(user.id, !user.isActive);
    if (!result.success) {
      notify.error(result.error ?? "Could not update user.");
      return;
    }
    notify.success(user.isActive ? "User deactivated" : "User reactivated");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <FormField label="Name">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label="Email">
          <input className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} />
        </FormField>
        <FormField label="Password">
          <input type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
        </FormField>
        <FormField label="Role">
          <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as AppRole)}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={handleCreate}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Add staff"}
      </button>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-3 font-medium">{user.name}</td>
                <td className="px-3 py-3">{user.email}</td>
                <td className="px-3 py-3">{ROLE_LABELS[user.role]}</td>
                <td className="px-3 py-3">{user.isActive ? "Active" : "Inactive"}</td>
                <td className="px-3 py-3 text-right">
                  <button type="button" onClick={() => handleToggle(user)} className="text-xs font-medium text-brand-700 hover:underline">
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
