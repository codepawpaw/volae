import Link from "next/link";
import { ChevronDown, Globe } from "lucide-react";
import { site } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";

export function UtilityBar() {
  return (
    <div className="hidden bg-utility lg:block">
      <div className="mx-auto flex h-[35px] max-w-[1920px] items-center justify-end gap-[22px] px-14 text-[14px]">
        <a href={whatsappLink(`Halo ${site.brandName}, saya ingin cek status pesanan saya.`)} target="_blank" rel="noopener noreferrer" className="hover:underline">
          Track Order &amp; Return
        </a>
        <Link href="/brands" className="hover:underline">
          Brands
        </Link>
        <a href="#email-signup" className="hover:underline">
          Email Signup
        </a>
        <Link href="/sale" className="hover:underline">
          We Made Too Much
        </Link>
        <span className="flex items-center gap-1.5">
          <Globe className="size-[18px]" strokeWidth={1.25} />
          {site.region}
        </span>
        <span className="flex items-center gap-1">
          {site.language}
          <ChevronDown className="size-4" strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}
