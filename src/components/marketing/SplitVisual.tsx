const recipients = [
  { name: "Amelia R.", top: "6%" },
  { name: "Daniel K.", top: "38%" },
  { name: "Priya S.", top: "70%" },
];

export function SplitVisual() {
  return (
    <div className="relative mx-auto h-[340px] w-full max-w-md md:h-[380px]">
      {/* Source composer card */}
      <div className="absolute left-0 top-1/2 w-40 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-indigo-100">
        <div className="mb-2 h-2 w-16 rounded-full bg-brand-indigo/30" />
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
          <div className="h-1.5 w-3/5 rounded-full bg-slate-100" />
        </div>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-indigo/10 px-2 py-0.5 text-[10px] font-semibold text-brand-indigo">
          1 campaign
        </div>
      </div>

      {/* Connecting paths + individual sends */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 340"
        fill="none"
        aria-hidden="true"
      >
        <path d="M 150 170 C 220 60, 260 40, 340 34" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 5" />
        <path d="M 150 170 C 220 170, 260 170, 340 170" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 5" />
        <path d="M 150 170 C 220 280, 260 300, 340 306" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 5" />
      </svg>

      {recipients.map((r, i) => (
        <div
          key={r.name}
          className="absolute right-0 flex w-36 -translate-y-1/2 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md"
          style={{ top: r.top, animation: `float 5s ease-in-out ${i * 0.4}s infinite` }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-[10px] font-semibold text-white">
            {r.name.split(" ").map((p) => p[0]).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-slate-700">{r.name}</p>
            <p className="text-[10px] text-brand-success">Sent — individually</p>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(calc(-50% - 6px)); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
