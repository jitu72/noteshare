import { redirect } from "next/navigation";
import { getCurrentUser, getSession } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import { ProfileForm, PasswordForm } from "./ProfileForms";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="container-app max-w-2xl">
      <AppHeader title="👤 My Profile" username={session.username} />
      <ProfileForm
        username={user.username}
        name={user.name ?? ""}
        email={user.email}
      />
      <PasswordForm />
    </div>
  );
}
