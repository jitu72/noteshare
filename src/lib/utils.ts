import { randomBytes } from "crypto";

/** Human readable file size, mirroring the original format_file_size(). */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const factor = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, factor);
  return `${value.toFixed(1)} ${units[factor]}`;
}

/** Random hex token for public share links (matches generate_share_token()). */
export function generateShareToken(): string {
  return randomBytes(16).toString("hex");
}

/** Validates a custom share slug: 3-20 chars, letters/numbers/-/_. */
export function isValidSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(slug);
}

const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "doc",
  "docx",
  "txt",
  "rtf",
  "pdf",
  "xls",
  "xlsx",
  "csv",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "File type not allowed" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size too large (max 10MB)" };
  }
  return { valid: true };
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

/** True when an attachment can be rendered inline as an image preview. */
export function isImageAttachment(
  resourceType: string,
  filename: string,
  mimeType?: string
): boolean {
  if (resourceType === "image") return true;
  if (mimeType?.startsWith("image/")) return true;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.includes(ext);
}

/** Icon emoji for a filename, used in attachment lists. */
export function fileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "pdf":
      return "📄";
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return "📝";
    case "xls":
    case "xlsx":
    case "csv":
      return "📊";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return "🖼️";
    default:
      return "📎";
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
