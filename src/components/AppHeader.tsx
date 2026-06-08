import Link from "next/link";
import { logoutAction } from "@/actions/auth";

export default function AppHeader({
  title,
  username,
  subtitle,
}: {
  title: string;
  username?: string;
  subtitle?: string;
}) {
  return (
    <header className="glass mb-8 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          <span className="gradient-text">{title}</span>
        </h1>
        {subtitle ? (
          <p className="mt-1 text-slate-500">{subtitle}</p>
        ) : username ? (
          <p className="mt-1 text-slate-500">Welcome back, {username}! ✨</p>
        ) : null}
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard" className="btn btn-primary btn-sm">
          🏠 Dashboard
        </Link>
        <Link href="/shared-with-me" className="btn btn-secondary btn-sm">
          🤝 Shared With Me
        </Link>
        <Link href="/categories" className="btn btn-secondary btn-sm">
          🏷️ Categories
        </Link>
        <Link href="/profile" className="btn btn-secondary btn-sm">
          👤 Profile
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-secondary btn-sm">
            👋 Logout
          </button>
        </form>
      </nav>
    </header>
  );
}
