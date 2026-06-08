import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { getNoteAccess, canEdit } from "@/lib/access";
import { notesCol, attachmentsCol } from "@/lib/models";
import { deleteAttachmentAction } from "@/actions/notes";
import AppHeader from "@/components/AppHeader";
import NoteForm from "@/components/NoteForm";
import ConfirmForm from "@/components/ConfirmForm";
import { formatFileSize, fileIcon, isImageAttachment } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await getNoteAccess(id, session.userId);
  if (!canEdit(access)) redirect("/dashboard");

  const notes = await notesCol();
  const note = await notes.findOne({ _id: new ObjectId(id) });
  if (!note) redirect("/dashboard");

  const attachments = await (await attachmentsCol())
    .find({ noteId: note._id })
    .sort({ uploadedAt: 1 })
    .toArray();

  return (
    <div className="container-app max-w-4xl">
      <AppHeader title="✏️ Edit Note" username={session.username} />

      {attachments.length > 0 && (
        <div className="glass mb-6 p-6">
          <h3 className="label">📎 Current Attachments</h3>
          <div className="grid gap-3">
            {attachments.map((a) => (
              <div
                key={a._id.toString()}
                className="flex flex-col items-start gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
              >
                {isImageAttachment(a.resourceType, a.originalFilename, a.mimeType) ? (
                  <a href={a.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.originalFilename}
                      loading="lazy"
                      className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  </a>
                ) : (
                  <span className="text-3xl">{fileIcon(a.originalFilename)}</span>
                )}
                <span className="flex-1 font-semibold text-slate-800">
                  {a.originalFilename}
                </span>
                <span className="text-sm text-slate-500">
                  ({formatFileSize(a.fileSize)})
                </span>
                <div className="flex gap-2">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    ⬇️ Download
                  </a>
                  <ConfirmForm
                    action={deleteAttachmentAction}
                    hidden={{ attachment_id: a._id.toString(), note_id: id }}
                    message="Are you sure you want to delete this attachment?"
                  >
                    <button type="submit" className="btn btn-danger btn-sm">
                      🗑️ Delete
                    </button>
                  </ConfirmForm>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NoteForm noteId={id} initialTitle={note.title} initialContent={note.content} />
    </div>
  );
}
