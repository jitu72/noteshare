"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  changePasswordAction,
  type ProfileState,
} from "@/actions/profile";
import SubmitButton from "@/components/SubmitButton";

const initial: ProfileState = {};

export function ProfileForm({
  name,
  email,
  username,
}: {
  name: string;
  email: string;
  username: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initial);
  return (
    <form action={formAction} className="glass mb-8 p-6 sm:p-8">
      <h3 className="mb-4 text-xl font-bold text-slate-800">👤 Account Details</h3>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      {state.success && <div className="alert alert-success">{state.success}</div>}

      <div className="mb-4">
        <label className="label">Username</label>
        <input value={username} disabled className="input bg-slate-100 text-slate-500" />
      </div>
      <div className="mb-4">
        <label className="label">Full Name</label>
        <input name="name" defaultValue={name} className="input" />
      </div>
      <div className="mb-4">
        <label className="label">Email</label>
        <input name="email" type="email" defaultValue={email} required className="input" />
      </div>
      <SubmitButton className="btn btn-accent" pendingText="Saving…">
        💾 Save Changes
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initial);
  return (
    <form action={formAction} className="glass p-6 sm:p-8">
      <h3 className="mb-4 text-xl font-bold text-slate-800">🔒 Change Password</h3>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      {state.success && <div className="alert alert-success">{state.success}</div>}

      <div className="mb-4">
        <label className="label">Current Password</label>
        <input name="current_password" type="password" required className="input" />
      </div>
      <div className="mb-4">
        <label className="label">New Password</label>
        <input name="new_password" type="password" required className="input" />
      </div>
      <div className="mb-4">
        <label className="label">Confirm New Password</label>
        <input name="confirm_password" type="password" required className="input" />
      </div>
      <SubmitButton className="btn btn-accent" pendingText="Updating…">
        🔑 Update Password
      </SubmitButton>
    </form>
  );
}
