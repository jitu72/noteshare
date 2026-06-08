"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { notesCol, usersCol, sharedNotesCol } from "@/lib/models";
import { getCurrentUserId } from "@/lib/auth";
import { generateShareToken, isValidSlug } from "@/lib/utils";

export interface ShareState {
  error?: string;
  success?: string;
}

async function ownedNote(noteId: string, userId: string) {
  let oid: ObjectId;
  try {
    oid = new ObjectId(noteId);
  } catch {
    return null;
  }
  const notes = await notesCol();
  return notes.findOne({ _id: oid, userId: new ObjectId(userId) });
}

export async function generatePublicLinkAction(
  _prev: ShareState,
  formData: FormData
): Promise<ShareState> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const noteId = String(formData.get("note_id") ?? "");
  const note = await ownedNote(noteId, userId);
  if (!note) return { error: "Note not found" };

  const customSlug = String(formData.get("custom_slug") ?? "").trim();
  let token: string;

  if (customSlug) {
    if (!isValidSlug(customSlug)) {
      return {
        error:
          "Custom URL must be 3-20 characters: letters, numbers, hyphens, underscores only.",
      };
    }
    const notes = await notesCol();
    const taken = await notes.findOne({
      shareToken: customSlug,
      _id: { $ne: note._id },
    });
    if (taken) return { error: "That custom URL is already taken. Please choose another." };
    token = customSlug;
  } else {
    token = generateShareToken();
  }

  const notes = await notesCol();
  await notes.updateOne(
    { _id: note._id },
    { $set: { isPublic: true, shareToken: token, updatedAt: new Date() } }
  );
  revalidatePath(`/notes/${noteId}/share`);
  return { success: "Public share link generated successfully!" };
}

export async function updateCustomUrlAction(
  _prev: ShareState,
  formData: FormData
): Promise<ShareState> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const noteId = String(formData.get("note_id") ?? "");
  const note = await ownedNote(noteId, userId);
  if (!note) return { error: "Note not found" };

  const customSlug = String(formData.get("custom_slug") ?? "").trim();
  if (!customSlug) return { error: "Please enter a custom URL." };
  if (!isValidSlug(customSlug)) {
    return {
      error:
        "Custom URL must be 3-20 characters: letters, numbers, hyphens, underscores only.",
    };
  }

  const notes = await notesCol();
  const taken = await notes.findOne({
    shareToken: customSlug,
    _id: { $ne: note._id },
  });
  if (taken) return { error: "That custom URL is already taken. Please choose another." };

  await notes.updateOne(
    { _id: note._id },
    { $set: { shareToken: customSlug, updatedAt: new Date() } }
  );
  revalidatePath(`/notes/${noteId}/share`);
  return { success: "Custom URL updated successfully!" };
}

export async function disablePublicLinkAction(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const noteId = String(formData.get("note_id") ?? "");
  const note = await ownedNote(noteId, userId);
  if (!note) redirect("/dashboard");

  const notes = await notesCol();
  await notes.updateOne(
    { _id: note._id },
    { $set: { isPublic: false, shareToken: null, updatedAt: new Date() } }
  );
  revalidatePath(`/notes/${noteId}/share`);
  redirect(`/notes/${noteId}/share`);
}

export async function shareWithUserAction(
  _prev: ShareState,
  formData: FormData
): Promise<ShareState> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const noteId = String(formData.get("note_id") ?? "");
  const note = await ownedNote(noteId, userId);
  if (!note) return { error: "Note not found" };

  const targetId = String(formData.get("share_with_user_id") ?? "");
  // Form uses "read"/"edit"; store as "read"/"write" to match the data model.
  const rawPermission = String(formData.get("permission") ?? "read");
  const permission = rawPermission === "edit" || rawPermission === "write" ? "write" : "read";

  if (!targetId) return { error: "Please select a user to share with" };
  if (targetId === userId) return { error: "You cannot share a note with yourself" };

  let targetOid: ObjectId;
  try {
    targetOid = new ObjectId(targetId);
  } catch {
    return { error: "Invalid user" };
  }

  const users = await usersCol();
  const target = await users.findOne({ _id: targetOid });
  if (!target) return { error: "User not found" };

  const shared = await sharedNotesCol();
  await shared.updateOne(
    { noteId: note._id, sharedWithUserId: targetOid },
    {
      $set: { permission },
      $setOnInsert: {
        noteId: note._id,
        sharedByUserId: new ObjectId(userId),
        sharedWithUserId: targetOid,
        sharedAt: new Date(),
      },
    },
    { upsert: true }
  );

  revalidatePath(`/notes/${noteId}/share`);
  return { success: `Note shared with ${target.username}` };
}

export async function removeShareAction(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const noteId = String(formData.get("note_id") ?? "");
  const sharedId = String(formData.get("shared_id") ?? "");
  const note = await ownedNote(noteId, userId);
  if (!note) redirect("/dashboard");

  try {
    const shared = await sharedNotesCol();
    await shared.deleteOne({
      _id: new ObjectId(sharedId),
      noteId: note._id,
      sharedByUserId: new ObjectId(userId),
    });
  } catch {
    /* ignore invalid id */
  }

  revalidatePath(`/notes/${noteId}/share`);
  redirect(`/notes/${noteId}/share`);
}
