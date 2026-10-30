"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { Field, FormError, inputClass, primaryButton } from "../_components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-5">
      <FormError message={state?.error} />
      <Field label="Username" htmlFor="username">
        <input id="username" name="username" required autoComplete="username" className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>
      <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
        {pending ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
