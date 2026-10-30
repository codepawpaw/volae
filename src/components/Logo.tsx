import Link from "next/link";
import { site } from "@/config/site";

export function LogoMark({ className = "size-[22px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      <path
        d="M6.6 7.2c1.4 0 2 .6 2.5 1.9l2.9 7.3 2.9-7.3c.5-1.3 1.1-1.9 2.5-1.9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label={`${site.brandName} home`} className={`flex items-center gap-1.5 text-black ${className}`}>
      <LogoMark />
      <span className="text-[25px] font-bold leading-none tracking-[-0.03em]">{site.brandName}</span>
    </Link>
  );
}
