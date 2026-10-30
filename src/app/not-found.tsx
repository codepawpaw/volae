import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center bg-page px-5 py-24 text-center">
      <h1 className="text-[40px] font-bold tracking-[-0.02em]">Page not found</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link
        href="/"
        className="mt-8 flex h-[56px] w-[260px] items-center justify-center bg-black text-[13px] font-bold uppercase tracking-[0.14em] text-white"
      >
        Back to Home
      </Link>
    </div>
  );
}
