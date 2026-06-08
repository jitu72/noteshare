import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import NoteForm from "@/components/NoteForm";

export default async function NewNotePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="container-app max-w-4xl">
      <AppHeader title="✍️ New Note" username={session.username} />
      <NoteForm />
    </div>
  );
}
