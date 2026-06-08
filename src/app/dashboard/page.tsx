import Link from "next/link";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { notesCol, attachmentsCol } from "@/lib/models";
import { deleteNoteAction } from "@/actions/notes";
import AppHeader from "@/components/AppHeader";
import ConfirmForm from "@/components/ConfirmForm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notes = await notesCol();
  const userNotes = await notes
    .find({ userId: new ObjectId(session.userId) })
    .sort({ updatedAt: -1 })
    .toArray();

  // Attachment counts per note (single aggregation).
  const attachments = await attachmentsCol();
  const noteIds = userNotes.map((n) => n._id);
  const counts = noteIds.length
    ? await attachments
        .aggregate<{ _id: ObjectId; count: number }>([
          { $match: { noteId: { $in: noteIds } } },
          { $group: { _id: "$noteId", count: { $sum: 1 } } },
        ])
        .toArray()
    : [];
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const totalAttachments = counts.reduce((sum, c) => sum + c.count, 0);
  const publicCount = userNotes.filter((n) => n.isPublic).length;

  return (
    <div className="container-app">
      <AppHeader title="📝 My Notes" username={session.username} />

      <div className="mb-6">
        <Link href="/notes/new" className="btn btn-accent">
          ✍️ New Note
        </Link>
      </div>

      {userNotes.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard number={userNotes.length} label="Total Notes" />
          <StatCard number={totalAttachments} label="Attachments" />
          <StatCard number={publicCount} label="Public Notes" />
        </div>
      )}

      {userNotes.length === 0 ? (
        <div className="glass p-16 text-center">
          <div className="mb-4 text-6xl opacity-50">🌟</div>
          <h3 className="mb-2 text-2xl font-bold text-slate-800">Start Your Journey</h3>
          <p className="mb-6 text-slate-500">
            Create your first note and begin organizing your thoughts, ideas, and important
            information!
          </p>
          <Link href="/notes/new" className="btn btn-accent">
            🚀 Create Your First Note
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {userNotes.map((note) => {
            const count = countMap.get(note._id.toString()) ?? 0;
            const id = note._id.toString();
            return (
              <div
                key={id}
                className="glass relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-glass-lg"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                />
                <h3 className="mb-3 text-xl font-bold">
                  <Link
                    href={`/notes/${id}`}
                    className="text-slate-800 transition hover:text-brand-start"
                  >
                    {note.title}
                  </Link>
                </h3>
                <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {note.content.slice(0, 150)}
                  {note.content.length > 150 ? "…" : ""}
                </p>

                {count > 0 && (
                  <div className="mb-3">
                    <span
                      className="badge"
                      style={{
                        background: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
                      }}
                    >
                      📎 {count} attachment{count > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t-2 border-slate-100 pt-4">
                  <span className="text-xs font-medium text-slate-400">
                    🕒 {formatDate(note.updatedAt.toISOString())}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/notes/${id}`} className="btn btn-primary btn-sm">
                      👀 View
                    </Link>
                    <Link href={`/notes/${id}/edit`} className="btn btn-secondary btn-sm">
                      ✏️ Edit
                    </Link>
                    <Link href={`/notes/${id}/share`} className="btn btn-secondary btn-sm">
                      🔗 Share
                    </Link>
                    <ConfirmForm
                      action={deleteNoteAction}
                      hidden={{ id }}
                      message="Are you sure you want to delete this note? This action cannot be undone."
                    >
                      <button type="submit" className="btn btn-danger btn-sm">
                        🗑️ Delete
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ number, label }: { number: number; label: string }) {
  return (
    <div className="glass p-6 text-center transition hover:-translate-y-1">
      <div className="text-4xl font-extrabold">
        <span className="gradient-text">{number}</span>
      </div>
      <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}
