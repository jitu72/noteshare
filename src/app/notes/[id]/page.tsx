import Link from "next/link";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { getNoteAccess, canEdit } from "@/lib/access";
import { notesCol, attachmentsCol, usersCol, toAttachmentView } from "@/lib/models";
import AppHeader from "@/components/AppHeader";
import AttachmentGrid from "@/components/AttachmentGrid";
import { formatDateLong } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ViewNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await getNoteAccess(id, session.userId);
  if (!access) redirect("/dashboard");

  const notes = await notesCol();
  const note = await notes.findOne({ _id: new ObjectId(id) });
  if (!note) redirect("/dashboard");

  const author = await (await usersCol()).findOne({ _id: note.userId });
  const attachments = await (await attachmentsCol())
    .find({ noteId: note._id })
    .sort({ uploadedAt: 1 })
    .toArray();

  const editable = canEdit(access);

  return (
    <div className="container-app max-w-4xl">
      <AppHeader title="👀 View Note" username={session.username} />

      <div className="glass p-6 sm:p-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-extrabold text-slate-800">{note.title}</h2>
          <div className="flex gap-2">
            {editable && (
              <Link href={`/notes/${id}/edit`} className="btn btn-secondary btn-sm">
                ✏️ Edit
              </Link>
            )}
            {access === "owner" && (
              <Link href={`/notes/${id}/share`} className="btn btn-primary btn-sm">
                🔗 Share
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-lg border-l-4 border-brand-start bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex flex-wrap gap-x-8 gap-y-1">
            {author && (
              <span>
                <strong>✍️ Author:</strong> {author.username}
              </span>
            )}
            <span>
              <strong>📅 Created:</strong> {formatDateLong(note.createdAt.toISOString())}
            </span>
            <span>
              <strong>🔄 Updated:</strong> {formatDateLong(note.updatedAt.toISOString())}
            </span>
            {access !== "owner" && (
              <span className="badge" style={{ background: "#0984e3" }}>
                {access === "write" ? "Can edit" : "Read only"}
              </span>
            )}
          </div>
        </div>

        <div className="whitespace-pre-wrap break-words leading-relaxed text-slate-800">
          {note.content}
        </div>

        {attachments.length > 0 && (
          <div className="mt-8 border-t-2 border-slate-100 pt-6">
            <h4 className="mb-4 text-lg font-bold text-slate-800">📎 Attachments</h4>
            <AttachmentGrid attachments={attachments.map(toAttachmentView)} />
          </div>
        )}
      </div>
    </div>
  );
}
