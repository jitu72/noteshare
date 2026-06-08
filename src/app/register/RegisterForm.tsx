"use client";

import { useActionState } from "react";
import { registerAction, type AuthState } from "@/actions/auth";
import SubmitButton from "@/components/SubmitButton";

const initial: AuthState = {};

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <div className="alert alert-error">⚠️ {state.error}</div>}

      <div>
        <label htmlFor="name" className="label">
          🙂 Full Name
        </label>
        <input id="name" name="name" type="text" className="input" />
      </div>

      <div>
        <label htmlFor="username" className="label">
          👤 Username
        </label>
        <input id="username" name="username" type="text" required className="input" />
      </div>

      <div>
        <label htmlFor="email" className="label">
          📧 Email
        </label>
        <input id="email" name="email" type="email" required className="input" />
      </div>

      <div>
        <label htmlFor="password" className="label">
          🔒 Password
        </label>
        <input id="password" name="password" type="password" required className="input" />
      </div>

      <div>
        <label htmlFor="confirm_password" className="label">
          🔒 Confirm Password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          className="input"
        />
      </div>

      <SubmitButton pendingText="Creating account…">✨ Create Account</SubmitButton>
    </form>
  );
}
