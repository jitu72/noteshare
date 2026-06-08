"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { usersCol } from "@/lib/models";
import { getCurrentUserId } from "@/lib/auth";

export interface ProfileState {
  error?: string;
  success?: string;
}

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "A valid email is required" };
  }

  const users = await usersCol();
  const oid = new ObjectId(userId);

  const emailTaken = await users.findOne({ email, _id: { $ne: oid } });
  if (emailTaken) return { error: "That email is already in use by another account" };

  await users.updateOne(
    { _id: oid },
    { $set: { name, email, updatedAt: new Date() } }
  );

  revalidatePath("/profile");
  return { success: "Profile updated successfully" };
}

export async function changePasswordAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (next.length < 6) return { error: "New password must be at least 6 characters" };
  if (next !== confirm) return { error: "New passwords do not match" };

  const users = await usersCol();
  const oid = new ObjectId(userId);
  const user = await users.findOne({ _id: oid });
  if (!user || !(await bcrypt.compare(current, user.password))) {
    return { error: "Current password is incorrect" };
  }

  const hash = await bcrypt.hash(next, 10);
  await users.updateOne({ _id: oid }, { $set: { password: hash, updatedAt: new Date() } });

  return { success: "Password changed successfully" };
}
