"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { usersCol, ensureIndexes } from "@/lib/models";
import { createSession, destroySession } from "@/lib/auth";

export interface AuthState {
  error?: string;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const identifier = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier) return { error: "Username is required" };
  if (!password) return { error: "Password is required" };

  const users = await usersCol();
  const user = await users.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Invalid username or password" };
  }

  await createSession({ userId: user._id.toString(), username: user.username });
  redirect("/dashboard");
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  await ensureIndexes();

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!username || username.length < 3) {
    return { error: "Username must be at least 3 characters" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: "Username may only contain letters, numbers, and underscores" };
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "A valid email is required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match" };
  }

  const users = await usersCol();
  const existing = await users.findOne({
    $or: [{ username }, { email }],
  });
  if (existing) {
    return {
      error:
        existing.username === username
          ? "That username is already taken"
          : "An account with that email already exists",
    };
  }

  const hash = await bcrypt.hash(password, 10);
  const now = new Date();
  const result = await users.insertOne({
    username,
    email,
    password: hash,
    name: name || username,
    createdAt: now,
    updatedAt: now,
  } as never);

  await createSession({ userId: result.insertedId.toString(), username });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
