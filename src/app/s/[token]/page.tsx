import Link from "next/link";
import { notFound } from "next/navigation";
import { notesCol, attachmentsCol, usersCol, toAttachmentView } from "@/lib/models";
import AttachmentGrid from "@/components/AttachmentGrid";
import { formatDateLong } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicNotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const notes = await notesCol();
  const note = await notes.findOne({ shareToken: token, isPublic: true });
  if (!note) notFound();

  const author = await (await usersCol()).findOne({ _id: note.userId });
  const attachments = await (await attachmentsCol())
    .find({ noteId: note._id })
    .sort({ uploadedAt: 1 })
    .toArray();

  return (
    <div className="container-app max-w-3xl">
      <div
        className="mb-8 rounded-2xl p-8 text-center text-white shadow-glass"
        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
      >
        <h1 className="text-3xl font-extrabold">{note.title}</h1>
        <p className="mt-2">
          📝 Shared by <strong>{author?.username ?? "a user"}</strong>
        </p>
      </div>

      <div className="mb-6 rounded-lg border-l-4 border-brand-start bg-white/95 p-4 text-sm text-slate-600 shadow-glass">
        <div className="flex flex-wrap justify-between gap-2">
          <span>
            <strong>📅 Created:</strong> {formatDateLong(note.createdAt.toISOString())}
          </span>
          <span>
            <strong>🔄 Last Updated:</strong> {formatDateLong(note.updatedAt.toISOString())}
          </span>
        </div>
      </div>

      <div className="glass p-6 sm:p-8">
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

      <div className="mt-8 rounded-lg bg-white/95 p-6 text-center shadow-glass">
        <p className="mb-1 font-semibold text-slate-800">💡 Like what you see?</p>
        <p className="mb-4 text-slate-500">Create your own notes and share them with others!</p>
        <div className="flex justify-center gap-3">
          <Link href="/register" className="btn btn-accent">
            Sign Up for Free
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
