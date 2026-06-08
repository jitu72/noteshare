import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUserId } from "@/lib/auth";
import { usersCol } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  // Escape regex metacharacters from user input.
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(safe, "i");

  const users = await usersCol();
  const results = await users
    .find(
      {
        _id: { $ne: new ObjectId(userId) },
        $or: [{ username: rx }, { email: rx }],
      },
      { projection: { username: 1, email: 1 } }
    )
    .limit(10)
    .toArray();

  return NextResponse.json(
    results.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
    }))
  );
}
