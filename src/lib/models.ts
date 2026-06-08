import { ObjectId, Collection } from "mongodb";
import { getDb } from "./mongodb";

// ---- Document shapes (MongoDB collections) ----

export interface UserDoc {
  _id: ObjectId;
  username: string;
  email: string;
  password: string; // bcrypt hash
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDoc {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  color: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteDoc {
  _id: ObjectId;
  userId: ObjectId;
  categoryId: ObjectId | null;
  title: string;
  content: string;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentDoc {
  _id: ObjectId;
  noteId: ObjectId;
  publicId: string; // Cloudinary public_id (for deletion)
  url: string; // Cloudinary secure_url
  resourceType: string; // image | raw | video
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export type SharePermission = "read" | "write";
export type CollaboratorPermission = "read" | "write" | "admin";

export interface SharedNoteDoc {
  _id: ObjectId;
  noteId: ObjectId;
  sharedByUserId: ObjectId;
  sharedWithUserId: ObjectId;
  permission: SharePermission;
  sharedAt: Date;
}

export interface CollaboratorDoc {
  _id: ObjectId;
  noteId: ObjectId;
  userId: ObjectId;
  permission: CollaboratorPermission;
  invitedAt: Date;
}

// ---- Typed collection accessors ----

export async function usersCol(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}
export async function notesCol(): Promise<Collection<NoteDoc>> {
  return (await getDb()).collection<NoteDoc>("notes");
}
export async function categoriesCol(): Promise<Collection<CategoryDoc>> {
  return (await getDb()).collection<CategoryDoc>("categories");
}
export async function attachmentsCol(): Promise<Collection<AttachmentDoc>> {
  return (await getDb()).collection<AttachmentDoc>("attachments");
}
export async function sharedNotesCol(): Promise<Collection<SharedNoteDoc>> {
  return (await getDb()).collection<SharedNoteDoc>("shared_notes");
}
export async function collaboratorsCol(): Promise<Collection<CollaboratorDoc>> {
  return (await getDb()).collection<CollaboratorDoc>("collaborators");
}

// Create indexes that mirror the original MySQL schema constraints.
// Safe to call repeatedly; createIndex is idempotent.
let indexesEnsured = false;
export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const users = await usersCol();
  const notes = await notesCol();
  const categories = await categoriesCol();
  const shared = await sharedNotesCol();
  const collaborators = await collaboratorsCol();
  const attachments = await attachmentsCol();

  await Promise.all([
    users.createIndex({ username: 1 }, { unique: true }),
    users.createIndex({ email: 1 }, { unique: true }),
    notes.createIndex({ userId: 1 }),
    notes.createIndex(
      { shareToken: 1 },
      { unique: true, partialFilterExpression: { shareToken: { $type: "string" } } }
    ),
    categories.createIndex({ userId: 1, name: 1 }, { unique: true }),
    shared.createIndex({ noteId: 1, sharedWithUserId: 1 }, { unique: true }),
    shared.createIndex({ sharedWithUserId: 1 }),
    collaborators.createIndex({ noteId: 1, userId: 1 }, { unique: true }),
    attachments.createIndex({ noteId: 1 }),
  ]);
  indexesEnsured = true;
}

// ---- Plain serializable shapes for passing to client components ----

export interface NoteView {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  content: string;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  attachmentCount?: number;
}

export function toNoteView(n: NoteDoc, attachmentCount?: number): NoteView {
  return {
    id: n._id.toString(),
    userId: n.userId.toString(),
    categoryId: n.categoryId ? n.categoryId.toString() : null,
    title: n.title,
    content: n.content,
    isPublic: n.isPublic,
    shareToken: n.shareToken,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    attachmentCount,
  };
}

export interface AttachmentView {
  id: string;
  originalFilename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  resourceType: string;
}

export function toAttachmentView(a: AttachmentDoc): AttachmentView {
  return {
    id: a._id.toString(),
    originalFilename: a.originalFilename,
    url: a.url,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
    resourceType: a.resourceType,
  };
}
