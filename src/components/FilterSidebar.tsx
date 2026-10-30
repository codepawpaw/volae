"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import type { FilterGroup } from "@/lib/catalog";

export const FILTER_KEYS = ["category", "brand", "size", "color", "activity"];

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const navigate = (next: URLSearchParams) => {
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    const values = next.getAll(key);
    next.delete(key);
    const updated = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
    updated.forEach((v) => next.append(key, v));
    navigate(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams(params);
    FILTER_KEYS.forEach((k) => next.delete(k));
    navigate(next);
  };

  return { params, pending, toggle, clearAll, navigate };
}

export function FilterSidebar({ groups, onDone }: { groups: FilterGroup[]; onDone?: () => void }) {
  const { params, pending, toggle, clearAll } = useFilterNavigation();
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups.filter((g) => params.has(g.key)).map((g) => g.key)));

  const applied = groups.flatMap((g) =>
    g.options.filter((o) => params.getAll(g.key).includes(o.value)).map((o) => ({ key: g.key, ...o })),
  );

  return (
    <div className={`bg-white transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="border-b border-hairline px-6 py-4">
        {applied.length === 0 ? (
          <p className="text-[14px] text-muted">No filters applied</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold">{applied.length} filters applied</p>
              <button type="button" onClick={clearAll} className="text-[14px] underline underline-offset-2">
                Clear all
              </button>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {applied.map((a) => (
                <li key={a.key + a.value}>
                  <button
                    type="button"
                    onClick={() => toggle(a.key, a.value)}
                    className="flex items-center gap-1.5 border border-line px-2.5 py-1 text-[13px] hover:border-black"
                  >
                    {a.label}
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {groups.map((group) => {
        const isOpen = open.has(group.key);
        const selected = params.getAll(group.key);
        return (
          <div key={group.key} className="border-b border-hairline">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => {
                const next = new Set(open);
                if (isOpen) next.delete(group.key);
                else next.add(group.key);
                setOpen(next);
              }}
              className="flex w-full items-center justify-between px-6 py-[15px] text-[17px]"
            >
              {group.label}
              {isOpen ? <Minus className="size-5" strokeWidth={1.5} /> : <Plus className="size-5" strokeWidth={1.5} />}
            </button>
            {isOpen &&
              (group.key === "color" ? (
                <ul className="grid grid-cols-3 gap-x-2 gap-y-4 px-6 pb-6">
                  {group.options.map((o) => {
                    const active = selected.includes(o.value);
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          onClick={() => toggle(group.key, o.value)}
                          aria-pressed={active}
                          className="flex w-full flex-col items-center gap-1.5 text-center text-[12px] leading-tight"
                        >
                          <span
                            className={`flex size-[34px] items-center justify-center rounded-full border-2 ${active ? "border-black" : "border-transparent"}`}
                          >
                            <span className="size-[26px] rounded-full border border-black/15" style={{ background: o.hex }} />
                          </span>
                          {o.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : group.key === "size" ? (
                <ul className="flex flex-wrap gap-2 px-6 pb-6">
                  {group.options.map((o) => {
                    const active = selected.includes(o.value);
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          onClick={() => toggle(group.key, o.value)}
                          aria-pressed={active}
                          className={`h-[40px] min-w-[52px] border px-2 text-[14px] ${
                            active ? "border-black bg-black text-white" : "border-line hover:border-black"
                          }`}
                        >
                          {o.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="space-y-3 px-6 pb-6">
                  {group.options.map((o) => {
                    const active = selected.includes(o.value);
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={active}
                          onClick={() => toggle(group.key, o.value)}
                          className="flex w-full items-center gap-3 text-left text-[15px]"
                        >
                          <span
                            className={`flex size-[20px] shrink-0 items-center justify-center border ${
                              active ? "border-black bg-black text-white" : "border-subtle bg-white"
                            }`}
                          >
                            {active && <Check className="size-3.5" strokeWidth={2.5} />}
                          </span>
                          <span className="flex-1">{o.label}</span>
                          <span className="text-[13px] text-subtle">({o.count})</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ))}
          </div>
        );
      })}

      {onDone && (
        <div className="sticky bottom-0 bg-white p-4">
          <button
            type="button"
            onClick={onDone}
            className="h-[52px] w-full bg-black text-[13px] font-bold uppercase tracking-[0.14em] text-white"
          >
            View Results
          </button>
        </div>
      )}
    </div>
  );
}

export function SortSelect({ options, value }: { options: { value: string; label: string }[]; value: string }) {
  const { params, navigate } = useFilterNavigation();
  return (
    <label className="relative flex items-center gap-4 text-[15px]">
      <span className="hidden sm:inline">Sort by</span>
      <ChevronDown className="pointer-events-none absolute right-4 size-5" strokeWidth={1.5} />
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === options[0].value) next.delete("sort");
          else next.set("sort", e.target.value);
          navigate(next);
        }}
        className="h-[46px] w-[200px] cursor-pointer appearance-none border border-line bg-white pl-5 pr-12 text-[15px] font-semibold outline-none sm:w-[230px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MobileFilters({ groups, count }: { groups: FilterGroup[]; count: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-[46px] border border-black bg-white px-5 text-[13px] font-bold uppercase tracking-[0.14em] lg:hidden"
      >
        Filter{count > 0 ? ` (${count})` : ""}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-[400px] flex-col overflow-y-auto bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <p className="text-[13px] font-bold uppercase tracking-[0.14em]">Filter</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="p-1">
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </div>
            <FilterSidebar groups={groups} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
