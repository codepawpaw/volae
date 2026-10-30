"use client";

import { useActionState } from "react";
import type { FormState } from "../actions";

type Props = {
  id: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  confirmText: string;
};

export function DeleteButton({ id, action, confirmText }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="text-[14px] text-red-700 underline disabled:opacity-50">
        {pending ? "Menghapus…" : "Hapus"}
      </button>
      {state?.error && (
        <p role="alert" className="mt-1 max-w-[260px] text-left text-[12px] leading-snug text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
