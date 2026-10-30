"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/(shop)/actions";

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribe, null);
  return (
    <form action={action} id="email-signup" className="scroll-mt-28">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">Email Signup</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Be the first to hear about new arrivals, new brands and exclusive offers.
      </p>
      <div className="mt-4 flex">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          aria-label="Email address"
          className="h-[48px] min-w-0 flex-1 border border-black bg-white px-4 text-[15px] outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-[48px] shrink-0 bg-black px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
        >
          Sign Up
        </button>
      </div>
      {state && (
        <p role="status" className={`mt-2 text-[14px] ${state.ok ? "text-success" : "text-brand"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
