"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import {
  notesCol,
  attachmentsCol,
  sharedNotesCol,
  collaboratorsCol,
} from "@/lib/models";
import { getCurrentUserId } from "@/lib/auth";
import { getNoteAccess, canEdit } from "@/lib/access";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export interface NoteFormState {
  error?: string;
}

// Shape of attachment metadata produced by the browser's direct Cloudinary upload.
interface UploadedAttachment {
  publicId: string;
  url: string;
  resourceType: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
}

function parseUploadedAttachments(raw: string): UploadedAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (a): a is UploadedAttachment =>
          a &&
          typeof a.publicId === "string" &&
          typeof a.url === "string" &&
          a.url.startsWith("https://res.cloudinary.com/")
      )
      .map((a) => ({
        publicId: a.publicId,
        url: a.url,
        resourceType: typeof a.resourceType === "string" ? a.resourceType : "image",
        originalFilename:
          typeof a.originalFilename === "string" ? a.originalFilename : "file",
        fileSize: typeof a.fileSize === "number" ? a.fileSize : 0,
        mimeType:
          typeof a.mimeType === "string" ? a.mimeType : "application/octet-stream",
      }));
  } catch {
    return [];
  }
}

async function saveAttachments(noteId: ObjectId, items: UploadedAttachment[]) {
  if (items.length === 0) return;
  const attachments = await attachmentsCol();
  await attachments.insertMany(
    items.map((a) => ({
      noteId,
      publicId: a.publicId,
      url: a.url,
      resourceType: a.resourceType,
      originalFilename: a.originalFilename,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      uploadedAt: new Date(),
    })) as never[]
  );
}

export async function saveNoteAction(
  _prev: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const uploaded = parseUploadedAttachments(
    String(formData.get("uploaded_attachments") ?? "")
  );

  if (!title) return { error: "Title is required" };
  if (!content) return { error: "Content is required" };

  const notes = await notesCol();
  let noteId: ObjectId;

  if (id) {
    // Editing: must have write access (owner, shared-write, or collaborator).
    const access = await getNoteAccess(id, userId);
    if (!canEdit(access)) {
      return { error: "You do not have permission to edit this note" };
    }
    noteId = new ObjectId(id);
    await notes.updateOne(
      { _id: noteId },
      { $set: { title, content, updatedAt: new Date() } }
    );
  } else {
    const now = new Date();
    const result = await notes.insertOne({
      userId: new ObjectId(userId),
      categoryId: null,
      title,
      content,
      isPublic: false,
      shareToken: null,
      createdAt: now,
      updatedAt: now,
    } as never);
    noteId = result.insertedId;
  }

  await saveAttachments(noteId, uploaded);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const id = String(formData.get("id") ?? "");
  let noteOid: ObjectId;
  try {
    noteOid = new ObjectId(id);
  } catch {
    redirect("/dashboard");
  }

  const notes = await notesCol();
  const note = await notes.findOne({ _id: noteOid, userId: new ObjectId(userId) });
  if (!note) redirect("/dashboard");

  // Remove attachments (Cloudinary + DB), shares, collaborators, then the note.
  const attachments = await attachmentsCol();
  const noteAttachments = await attachments.find({ noteId: noteOid }).toArray();
  for (const a of noteAttachments) {
    await deleteFromCloudinary(a.publicId, a.resourceType);
  }
  await attachments.deleteMany({ noteId: noteOid });
  await (await sharedNotesCol()).deleteMany({ noteId: noteOid });
  await (await collaboratorsCol()).deleteMany({ noteId: noteOid });
  await notes.deleteOne({ _id: noteOid });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteAttachmentAction(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const attachmentId = String(formData.get("attachment_id") ?? "");
  const noteId = String(formData.get("note_id") ?? "");

  const access = await getNoteAccess(noteId, userId);
  if (!canEdit(access)) redirect(`/notes/${noteId}/edit`);

  const attachments = await attachmentsCol();
  let attOid: ObjectId;
  try {
    attOid = new ObjectId(attachmentId);
  } catch {
    redirect(`/notes/${noteId}/edit`);
  }
  const att = await attachments.findOne({ _id: attOid });
  if (att) {
    await deleteFromCloudinary(att.publicId, att.resourceType);
    await attachments.deleteOne({ _id: attOid });
  }

  revalidatePath(`/notes/${noteId}/edit`);
  redirect(`/notes/${noteId}/edit`);
}
