import { formatFileSize, fileIcon, isImageAttachment } from "@/lib/utils";
import type { AttachmentView } from "@/lib/models";

/**
 * Renders a note's attachments. Images get an inline, clickable preview;
 * other file types fall back to an icon + download button.
 */
export default function AttachmentGrid({
  attachments,
}: {
  attachments: AttachmentView[];
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {attachments.map((a) => {
        const image = isImageAttachment(a.resourceType, a.originalFilename, a.mimeType);
        return (
          <div
            key={a.id}
            className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white"
          >
            {image ? (
              <a href={a.url} target="_blank" rel="noopener noreferrer" title="View full image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.originalFilename}
                  loading="lazy"
                  className="h-44 w-full bg-slate-50 object-cover transition hover:opacity-90"
                />
              </a>
            ) : (
              <div className="flex h-44 items-center justify-center bg-slate-50 text-6xl">
                {fileIcon(a.originalFilename)}
              </div>
            )}
            <div className="p-3 text-center">
              <div
                className="truncate text-sm font-semibold text-slate-700"
                title={a.originalFilename}
              >
                {a.originalFilename}
              </div>
              <div className="mb-2 text-xs text-slate-500">
                {formatFileSize(a.fileSize)}
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                {image ? "🔍 View" : "⬇️ Download"}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
