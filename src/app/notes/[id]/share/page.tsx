import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { notesCol, sharedNotesCol, usersCol } from "@/lib/models";
import { removeShareAction } from "@/actions/sharing";
import AppHeader from "@/components/AppHeader";
import PublicLinkSection from "@/components/PublicLinkSection";
import UserShareSection from "@/components/UserShareSection";
import ConfirmForm from "@/components/ConfirmForm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const notes = await notesCol();
  let note;
  try {
    note = await notes.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.userId),
    });
  } catch {
    redirect("/dashboard");
  }
  if (!note) redirect("/dashboard");

  // Build origin for share URLs.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // Current shares with usernames.
  const sharesRaw = await (await sharedNotesCol())
    .find({ noteId: note._id })
    .sort({ sharedAt: -1 })
    .toArray();
  const users = await usersCol();
  const shares = await Promise.all(
    sharesRaw.map(async (s) => {
      const u = await users.findOne({ _id: s.sharedWithUserId });
      return {
        id: s._id.toString(),
        username: u?.username ?? "Unknown",
        email: u?.email ?? "",
        permission: s.permission,
        sharedAt: s.sharedAt.toISOString(),
      };
    })
  );

  return (
    <div className="container-app max-w-3xl">
      <AppHeader title="🔗 Share Note" username={session.username} />

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-white drop-shadow">{note.title}</h2>
        <p className="text-white/90">Manage sharing settings for this note</p>
        <div className="mt-3 flex justify-center gap-2">
          <Link href={`/notes/${id}/edit`} className="btn btn-secondary btn-sm">
            ✏️ Edit Note
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">
            🏠 Dashboard
          </Link>
        </div>
      </div>

      <PublicLinkSection
        noteId={id}
        isPublic={note.isPublic}
        shareToken={note.shareToken}
        origin={origin}
      />

      <UserShareSection noteId={id} />

      {shares.length > 0 && (
        <section className="glass p-6 sm:p-8">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
            📋 Currently Shared With
          </h3>
          <div className="space-y-3">
            {shares.map((s) => (
              <div
                key={s.id}
                className="flex flex-col items-start justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <strong className="text-slate-800">{s.username}</strong>
                  <small className="block text-slate-500">{s.email}</small>
                  <small className="text-slate-400">
                    Shared on {formatDate(s.sharedAt)}
                  </small>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="badge uppercase"
                    style={{
                      background:
                        s.permission === "write"
                          ? "linear-gradient(135deg, #00b894 0%, #00a085 100%)"
                          : "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
                    }}
                  >
                    {s.permission === "write" ? "Edit" : "Read"}
                  </span>
                  <ConfirmForm
                    action={removeShareAction}
                    hidden={{ note_id: id, shared_id: s.id }}
                    message="Remove sharing with this user?"
                  >
                    <button type="submit" className="btn btn-danger btn-sm">
                      ❌ Remove
                    </button>
                  </ConfirmForm>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
