import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4 py-16">
      <div className="w-full max-w-[400px] bg-white p-8 sm:p-10">
        <Link href="/" className="text-[26px] font-bold tracking-[-0.03em] text-black">
          {site.brandName}
        </Link>
        <h1 className="mb-8 mt-2 text-[15px] text-muted">Masuk ke panel admin</h1>
        <LoginForm />
      </div>
    </div>
  );
}
