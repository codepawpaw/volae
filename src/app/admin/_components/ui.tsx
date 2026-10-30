// Small presentational helpers shared by admin pages and forms.

export const inputClass =
  "h-[44px] w-full rounded-full border border-line bg-white px-5 text-[15px] text-ink outline-none focus:border-ink";
export const textareaClass =
  "w-full rounded-2xl border border-line bg-white px-5 py-3 text-[15px] text-ink outline-none focus:border-ink";
export const primaryButton =
  "inline-flex h-[44px] items-center justify-center rounded-full bg-ink px-8 text-[15px] text-white hover:bg-black disabled:opacity-50";
export const secondaryButton =
  "inline-flex h-[44px] items-center justify-center rounded-full border border-line bg-white px-8 text-[15px] text-ink hover:border-ink";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-[26px] font-semibold">{title}</h1>
      {action}
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mb-6 rounded-xl bg-[#e7efec] px-5 py-3 text-[14px] text-success">
      {children}
    </p>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-5 py-3 text-[14px] text-red-700">
      {message}
    </p>
  );
}
