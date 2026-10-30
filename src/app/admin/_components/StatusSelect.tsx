"use client";

import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "../actions";
import { STATUS_LABELS } from "./order-status";

export function StatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  return (
    <form action={updateOrderStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Status pesanan"
        // Save as soon as a new status is picked.
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-[38px] rounded-full border border-line bg-white px-4 text-[14px]"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
