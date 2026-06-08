import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { usersCol } from "./models";

const SESSION_COOKIE = "session";
const secretString = process.env.AUTH_SECRET;

if (!secretString) {
  throw new Error("AUTH_SECRET is not set. Add it to .env.local (see .env.example).");
}
const secret = new TextEncoder().encode(secretString);

export interface SessionPayload {
  userId: string;
  username: string;
}

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId === "string" && typeof payload.username === "string") {
      return { userId: payload.userId, username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}

/** Returns the current user id or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

/** Loads the full user document for the current session, or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const users = await usersCol();
  try {
    return await users.findOne({ _id: new ObjectId(session.userId) });
  } catch {
    return null;
  }
}
