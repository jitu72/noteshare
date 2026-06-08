import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { categoriesCol, notesCol } from "@/lib/models";
import { deleteCategoryAction } from "@/actions/categories";
import AppHeader from "@/components/AppHeader";
import CategoryForm from "@/components/CategoryForm";
import ConfirmForm from "@/components/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = new ObjectId(session.userId);
  const categories = await (await categoriesCol())
    .find({ userId })
    .sort({ name: 1 })
    .toArray();

  const notes = await notesCol();
  const counts = await notes
    .aggregate<{ _id: ObjectId | null; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ])
    .toArray();
  const countMap = new Map(counts.map((c) => [c._id ? c._id.toString() : "none", c.count]));

  return (
    <div className="container-app max-w-4xl">
      <AppHeader title="🏷️ Categories" username={session.username} />

      <CategoryForm />

      <div className="glass p-6 sm:p-8">
        <h3 className="mb-4 text-xl font-bold text-slate-800">Your Categories</h3>
        {categories.length === 0 ? (
          <p className="text-slate-500">No categories yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((c) => {
              const id = c._id.toString();
              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-5 w-5 rounded-full"
                      style={{ background: c.color }}
                    />
                    <div>
                      <strong className="text-slate-800">{c.name}</strong>
                      {c.description && (
                        <small className="block text-slate-500">{c.description}</small>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                      {countMap.get(id) ?? 0} note{(countMap.get(id) ?? 0) === 1 ? "" : "s"}
                    </span>
                    <ConfirmForm
                      action={deleteCategoryAction}
                      hidden={{ id }}
                      message="Delete this category? Notes in it will become uncategorized."
                    >
                      <button type="submit" className="btn btn-danger btn-sm">
                        🗑️ Delete
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-xl border-2 border-dashed border-slate-200 p-4 text-slate-500">
              <span>📂 Uncategorized</span>
              <span className="text-sm">
                {countMap.get("none") ?? 0} note{(countMap.get("none") ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
