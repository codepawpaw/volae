"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchShippingAreas } from "@/app/(shop)/actions";
import type { Area } from "@/lib/biteship";

type Props = {
  value: Area | null;
  onChange: (area: Area | null) => void;
  inputClassName: string;
  placeholder: string;
  label: string;
  id?: string;
  /** Message shown when nothing matches. */
  emptyText?: string;
};

/** Combobox over Biteship Maps: type a district, city or postal code, then pick one result. */
export function AreaSearch({ value, onChange, inputClassName, placeholder, label, id, emptyText = "No matching area." }: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<Area[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const latest = useRef(0);

  useEffect(() => {
    const q = query.trim();
    // Nothing to look up while the field shows the picked area or is too short.
    if (q.length < 3 || q === value?.name) return;
    const ticket = ++latest.current;
    const timer = setTimeout(() => {
      setLoading(true);
      searchShippingAreas(q)
        .then((areas) => {
          if (ticket !== latest.current) return;
          setResults(areas);
          setActive(areas.length ? 0 : -1);
          setOpen(true);
        })
        .finally(() => ticket === latest.current && setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query, value?.name]);

  const pick = (area: Area) => {
    onChange(area);
    setQuery(area.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        maxLength={100}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => results.length && query !== value?.name && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + results.length) % results.length);
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={inputClassName}
      />
      {loading && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-muted">…</span>}
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[280px] overflow-y-auto border border-line bg-white shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-[14px] text-muted">{emptyText}</li>
          ) : (
            results.map((area, i) => (
              <li
                key={area.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(area);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-4 py-2.5 text-[14px] ${i === active ? "bg-page" : ""}`}
              >
                {area.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
