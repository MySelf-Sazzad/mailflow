"use client";

import { useEffect, useState } from "react";

interface Template {
  id: string;
  name: string;
  category: string;
  htmlContent: string;
  isSystem: boolean;
}

const CATEGORIES = [
  "All", "Proposal", "Promotional", "Newsletter", "Follow-up", "Welcome",
  "Invitation", "Announcement", "Invoice", "Recruitment", "Portfolio outreach",
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState("All");
  const [preview, setPreview] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/param-change pattern
    setLoading(true);
    const params = category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
    fetch(`/api/templates${params}`)
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Templates</h1>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              category === c ? "bg-brand-indigo text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-brand-indigo"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : templates.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No templates in this category yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setPreview(t)}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-indigo hover:shadow-md"
            >
              <div className="h-24 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-2 text-[8px] text-slate-400">
                <div dangerouslySetInnerHTML={{ __html: t.htmlContent }} />
              </div>
              <p className="mt-3 font-medium text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-500">{t.category}{t.isSystem ? " · System" : ""}</p>
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setPreview(null)}>
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{preview.name}</h2>
              <button onClick={() => setPreview(null)} className="text-sm text-slate-500">Close</button>
            </div>
            <div className="rounded-lg border border-slate-100 p-4" dangerouslySetInnerHTML={{ __html: preview.htmlContent }} />
          </div>
        </div>
      )}
    </div>
  );
}
