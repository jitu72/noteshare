"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { categoriesCol, notesCol, ensureIndexes } from "@/lib/models";
import { getCurrentUserId } from "@/lib/auth";

export interface CategoryState {
  error?: string;
  success?: string;
}

export async function createCategoryAction(
  _prev: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  await ensureIndexes();

  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3498db").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return { error: "Category name is required" };

  const categories = await categoriesCol();
  const existing = await categories.findOne({
    userId: new ObjectId(userId),
    name,
  });
  if (existing) return { error: "You already have a category with that name" };

  const now = new Date();
  await categories.insertOne({
    userId: new ObjectId(userId),
    name,
    color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#3498db",
    description,
    createdAt: now,
    updatedAt: now,
  } as never);

  revalidatePath("/categories");
  return { success: `Category "${name}" created` };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const id = String(formData.get("id") ?? "");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    redirect("/categories");
  }

  // Uncategorize notes first, then delete the category.
  const notes = await notesCol();
  await notes.updateMany(
    { categoryId: oid, userId: new ObjectId(userId) },
    { $set: { categoryId: null } }
  );
  const categories = await categoriesCol();
  await categories.deleteOne({ _id: oid, userId: new ObjectId(userId) });

  revalidatePath("/categories");
  redirect("/categories");
}
