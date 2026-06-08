"use client";

import { useActionState } from "react";
import { createCategoryAction, type CategoryState } from "@/actions/categories";
import SubmitButton from "@/components/SubmitButton";

const initial: CategoryState = {};

export default function CategoryForm() {
  const [state, formAction] = useActionState(createCategoryAction, initial);

  return (
    <form action={formAction} className="glass mb-8 p-6 sm:p-8">
      <h3 className="mb-4 text-xl font-bold text-slate-800">➕ New Category</h3>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      {state.success && <div className="alert alert-success">{state.success}</div>}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label">Name</label>
          <input name="name" type="text" required className="input" placeholder="e.g. Work" />
        </div>
        <div>
          <label className="label">Color</label>
          <input
            name="color"
            type="color"
            defaultValue="#3498db"
            className="h-12 w-20 cursor-pointer rounded-xl border-2 border-slate-200"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Description (optional)</label>
        <input name="description" type="text" className="input" />
      </div>
      <div className="mt-4">
        <SubmitButton className="btn btn-accent" pendingText="Creating…">
          ✨ Create Category
        </SubmitButton>
      </div>
    </form>
  );
}
