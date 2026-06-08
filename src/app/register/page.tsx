import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="glass relative overflow-hidden p-8 sm:p-12">
          <div
            className="absolute inset-x-0 top-0 h-1.5"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          />
          <div className="mb-3 text-center text-5xl">🚀</div>
          <h1 className="mb-2 text-center text-4xl font-extrabold">
            <span className="gradient-text">Create Account</span>
          </h1>
          <p className="mb-8 text-center font-medium text-slate-500">
            Join us and start organizing your notes
          </p>

          <RegisterForm />

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-start hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
