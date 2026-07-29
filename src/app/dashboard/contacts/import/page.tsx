"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Summary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  failedRows: { rowNumber: number; email: string; invalidReason?: string }[];
  importedCount?: number;
  skippedForPlanLimit?: number;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [committed, setCommitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("commit", "false");

    const res = await fetch("/api/contacts/import", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data?.error ?? "Import failed.");
      return;
    }
    setSummary(data.summary);
  }

  async function confirmImport() {
    if (!file) return;
    setBusy(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("commit", "true");

    const res = await fetch("/api/contacts/import", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data?.error ?? "Import failed.");
      return;
    }
    setSummary(data.summary);
    setCommitted(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Import contacts</h1>
      <p className="text-sm text-slate-600">
        Upload a CSV or XLSX file. Columns named <code>email</code>, <code>first_name</code>,{" "}
        <code>last_name</code>, <code>phone</code>, and <code>company</code> (in any casing) are
        detected automatically.
      </p>

      {!summary && (
        <form onSubmit={runPreview} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {error && <p className="text-sm text-brand-error">{error}</p>}
          <button
            type="submit"
            disabled={!file || busy}
            className="rounded-full bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Reading file…" : "Preview import"}
          </button>
        </form>
      )}

      {summary && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Total rows" value={summary.totalRows} />
            <Stat label={committed ? "Imported" : "Valid"} value={committed ? summary.importedCount ?? 0 : summary.validCount} tone="success" />
            <Stat label="Duplicates" value={summary.duplicateCount} tone="warning" />
            <Stat label="Invalid" value={summary.invalidCount} tone="error" />
          </div>

          {committed && (summary.skippedForPlanLimit ?? 0) > 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {summary.skippedForPlanLimit} contacts were skipped — they would exceed your plan&apos;s
              contact limit. Upgrade your plan to import the rest.
            </p>
          )}

          {summary.failedRows.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Skipped rows</h2>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.failedRows.map((r) => (
                      <tr key={r.rowNumber}>
                        <td className="px-3 py-1.5">{r.rowNumber}</td>
                        <td className="px-3 py-1.5">{r.email || "—"}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.invalidReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-brand-error">{error}</p>}

          <div className="flex gap-3">
            {!committed ? (
              <>
                <button
                  onClick={confirmImport}
                  disabled={busy || summary.validCount === 0}
                  className="rounded-full bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {busy ? "Importing…" : `Import ${summary.validCount} contacts`}
                </button>
                <button
                  onClick={() => {
                    setSummary(null);
                    setFile(null);
                  }}
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Choose a different file
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/dashboard/contacts")}
                className="rounded-full bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                View contacts
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "error" }) {
  const color =
    tone === "success" ? "text-brand-success" : tone === "warning" ? "text-brand-warning" : tone === "error" ? "text-brand-error" : "text-slate-900";
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-display text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
