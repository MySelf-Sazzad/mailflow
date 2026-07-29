import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  dark?: boolean;
  subtitle?: string;
};

export function BrandLogo({ className = "h-12 w-auto", dark = false, subtitle }: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-0">
      <Image src="/brand/mailflow-logo.png" alt="" width={1536} height={1024} className={`${className} -mr-2`} priority />
      <span className="leading-tight">
        <strong className="block font-display text-xl font-semibold tracking-tight">
          <span className={dark ? "text-white" : "text-slate-950"}>Mail</span>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">Flow</span>
        </strong>
        {subtitle && <span className={`block text-xs ${dark ? "text-indigo-200" : "text-slate-500"}`}>{subtitle}</span>}
      </span>
    </span>
  );
}
