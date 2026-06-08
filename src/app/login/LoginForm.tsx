"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/actions/auth";
import SubmitButton from "@/components/SubmitButton";

const initial: AuthState = {};

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <div className="alert alert-error">⚠️ {state.error}</div>}

      <div>
        <label htmlFor="username" className="label">
          📧 Username or Email
        </label>
        <input id="username" name="username" type="text" required className="input" />
      </div>

      <div>
        <label htmlFor="password" className="label">
          🔒 Password
        </label>
        <input id="password" name="password" type="password" required className="input" />
      </div>

      <SubmitButton pendingText="Signing in…">🚀 Sign In</SubmitButton>
    </form>
  );
}
