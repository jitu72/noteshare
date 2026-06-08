import Link from "next/link";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { sharedNotesCol, notesCol, usersCol } from "@/lib/models";
import AppHeader from "@/components/AppHeader";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SharedWithMePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const shared = await sharedNotesCol();
  const myShares = await shared
    .find({ sharedWithUserId: new ObjectId(session.userId) })
    .sort({ sharedAt: -1 })
    .toArray();

  const notes = await notesCol();
  const users = await usersCol();

  const items = await Promise.all(
    myShares.map(async (s) => {
      const note = await notes.findOne({ _id: s.noteId });
      if (!note) return null;
      const owner = await users.findOne({ _id: note.userId });
      return {
        id: note._id.toString(),
        title: note.title,
        content: note.content,
        owner: owner?.username ?? "Unknown",
        permission: s.permission,
        sharedAt: s.sharedAt.toISOString(),
      };
    })
  );
  const visible = items.filter((i): i is NonNullable<typeof i> => i !== null);

  return (
    <div className="container-app">
      <AppHeader title="🤝 Shared With Me" username={session.username} />

      {visible.length === 0 ? (
        <div className="glass p-16 text-center">
          <div className="mb-4 text-6xl opacity-50">📭</div>
          <h3 className="mb-2 text-2xl font-bold text-slate-800">Nothing here yet</h3>
          <p className="text-slate-500">
            When other users share notes with you, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((n) => (
            <div key={n.id} className="glass relative overflow-hidden p-6">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
              />
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{n.title}</h3>
                <span
                  className="badge uppercase"
                  style={{
                    background:
                      n.permission === "write"
                        ? "linear-gradient(135deg, #00b894 0%, #00a085 100%)"
                        : "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
                  }}
                >
                  {n.permission === "write" ? "Edit" : "Read"}
                </span>
              </div>
              <p className="mb-1 text-xs text-slate-400">👤 Shared by {n.owner}</p>
              <p className="mb-4 whitespace-pre-wrap text-sm text-slate-600">
                {n.content.slice(0, 150)}
                {n.content.length > 150 ? "…" : ""}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-slate-100 pt-4">
                <span className="text-xs text-slate-400">🕒 {formatDate(n.sharedAt)}</span>
                <div className="flex gap-2">
                  <Link href={`/notes/${n.id}`} className="btn btn-primary btn-sm">
                    👀 View
                  </Link>
                  {n.permission === "write" && (
                    <Link href={`/notes/${n.id}/edit`} className="btn btn-secondary btn-sm">
                      ✏️ Edit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
