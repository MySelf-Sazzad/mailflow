"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Contact {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  company?: string | null;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set("q", query);
    if (status) params.set("status", status);

    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setPagination(data.pagination ?? null);
    setLoading(false);
  }, [page, query, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/param-change pattern
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Contacts</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/contacts/import"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-indigo hover:text-brand-indigo"
          >
            Import CSV / XLSX
          </Link>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add contact
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddContactForm
          onCreated={() => {
            setShowAddForm(false);
            load();
          }}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
          placeholder="Search by name, email, or company"
          className="input max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="input max-w-[180px]"
        >
          <option value="">All statuses</option>
          <option value="SUBSCRIBED">Subscribed</option>
          <option value="UNSUBSCRIBED">Unsubscribed</option>
          <option value="BOUNCED">Bounced</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  No contacts yet. Add one or import a file to get started.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-slate-900">
                    {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600">{c.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{pagination.total} contacts</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUBSCRIBED: "bg-emerald-50 text-emerald-700",
    UNSUBSCRIBED: "bg-slate-100 text-slate-600",
    BOUNCED: "bg-amber-50 text-amber-700",
    BLOCKED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function AddContactForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName }),
    });
    setSaving(false);
    if (res.ok) {
      onCreated();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not add contact.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">First name</span>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input w-40" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Last name</span>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input w-40" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="input w-64" />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save contact"}
      </button>
      {error && <p className="w-full text-sm text-brand-error">{error}</p>}
    </form>
  );
}
