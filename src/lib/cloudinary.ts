import "server-only";
import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/**
 * Produces a short-lived signature so the browser can upload a file directly
 * to Cloudinary without the bytes passing through our serverless function.
 */
export function signUploadParams(folder = "note-app"): UploadSignature {
  configure();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    timestamp,
    signature,
    folder,
  };
}

export interface UploadResult {
  publicId: string;
  url: string;
  resourceType: string;
  bytes: number;
}

/**
 * Uploads a file (from a Web File / Blob) to Cloudinary under the app folder.
 * Uses resource_type "auto" so images, PDFs, docs, etc. are all handled.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "note-app"
): Promise<UploadResult> {
  configure();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: result.resource_type,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: string
): Promise<void> {
  configure();
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "image",
    });
  } catch {
    // Best-effort cleanup; ignore failures so the DB record can still be removed.
  }
}
