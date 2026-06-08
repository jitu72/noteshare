import "server-only";
import { ObjectId } from "mongodb";
import {
  notesCol,
  sharedNotesCol,
  collaboratorsCol,
} from "./models";

export type AccessLevel = "owner" | "write" | "read" | false;

/**
 * Determines a user's access level to a note, mirroring the original
 * can_user_access_note(): owner > shared permission > collaborator permission.
 */
export async function getNoteAccess(
  noteId: string,
  userId: string
): Promise<AccessLevel> {
  let noteOid: ObjectId;
  let userOid: ObjectId;
  try {
    noteOid = new ObjectId(noteId);
    userOid = new ObjectId(userId);
  } catch {
    return false;
  }

  const notes = await notesCol();
  const owned = await notes.findOne({ _id: noteOid, userId: userOid });
  if (owned) return "owner";

  const shared = await (await sharedNotesCol()).findOne({
    noteId: noteOid,
    sharedWithUserId: userOid,
  });
  if (shared) return shared.permission; // "read" | "write"

  const collab = await (await collaboratorsCol()).findOne({
    noteId: noteOid,
    userId: userOid,
  });
  if (collab) {
    return collab.permission === "admin" || collab.permission === "write"
      ? "write"
      : "read";
  }

  return false;
}

export function canEdit(level: AccessLevel): boolean {
  return level === "owner" || level === "write";
}
