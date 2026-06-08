import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { cloudinaryConfigured, signUploadParams } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// Returns a signed payload the browser uses to upload directly to Cloudinary.
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "File attachments are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(signUploadParams());
}
