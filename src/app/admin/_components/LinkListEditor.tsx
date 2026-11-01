"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useState } from "react";
import type { LinkSetting } from "@/lib/types";
import { inputClass, secondaryButton } from "./ui";

export const iconButton =
  "grid size-9 shrink-0 place-items-center rounded-full border border-line hover:border-black disabled:opacity-30";

/** Moves an item within a list, for the up/down buttons. */
export function moveItem<T>(rows: T[], from: number, to: number): T[] {
  const next = [...rows];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

type Props = {
  links: LinkSetting[];
  /** Form field names; the server pairs them up by position. */
  labelName: string;
  hrefName: string;
  /** Extra hidden field sent with every row, e.g. which footer column the link belongs to. */
  group?: { name: string; value: string };
  /** Id of a <datalist> with URL suggestions. */
  listId?: string;
  max?: number;
};

/** Editable list of label + URL rows that can be added, removed and reordered. */
export function LinkListEditor({ links: initial, labelName, hrefName, group, listId, max = 10 }: Props) {
  // Keys keep inputs stable while rows are added, removed and reordered.
  const [links, setLinks] = useState(() => initial.map((l, i) => ({ ...l, key: i })));
  const [nextKey, setNextKey] = useState(initial.length);
  const move = (from: number, to: number) => setLinks((rows) => moveItem(rows, from, to));

  return (
    <div className="space-y-3">
      {links.map((l, i) => (
        <div key={l.key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {group && <input type="hidden" name={group.name} value={group.value} />}
          <input
            name={labelName}
            aria-label={`Label link ${i + 1}`}
            placeholder="Label"
            required
            maxLength={40}
            defaultValue={l.label}
            className={`${inputClass} sm:max-w-[200px]`}
          />
          <input
            name={hrefName}
            aria-label={`URL link ${i + 1}`}
            placeholder="/c/women"
            required
            maxLength={300}
            list={listId}
            defaultValue={l.href}
            className={inputClass}
          />
          <button type="button" aria-label="Naikkan" disabled={i === 0} onClick={() => move(i, i - 1)} className={iconButton}>
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Turunkan"
            disabled={i === links.length - 1}
            onClick={() => move(i, i + 1)}
            className={iconButton}
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Hapus link"
            onClick={() => setLinks((rows) => rows.filter((r) => r.key !== l.key))}
            className={iconButton}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {links.length === 0 && <p className="text-[14px] text-muted">Belum ada link.</p>}
      {links.length < max && (
        <button
          type="button"
          onClick={() => {
            setLinks((rows) => [...rows, { label: "", href: "", key: nextKey }]);
            setNextKey((k) => k + 1);
          }}
          className={secondaryButton}
        >
          Tambah link
        </button>
      )}
    </div>
  );
}
