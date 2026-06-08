import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="glass max-w-md p-10 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Not Found</h1>
        <p className="mb-6 text-slate-500">
          The page or shared note you&apos;re looking for doesn&apos;t exist or is no longer
          available.
        </p>
        <Link href="/" className="btn btn-accent">
          Go Home
        </Link>
      </div>
    </div>
  );
}
