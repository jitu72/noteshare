"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { saveNoteAction, type NoteFormState } from "@/actions/notes";
import { validateUploadFile } from "@/lib/utils";

const initial: NoteFormState = {};

interface UploadedAttachment {
  publicId: string;
  url: string;
  resourceType: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
}

async function uploadFile(file: File): Promise<UploadedAttachment> {
  const sigRes = await fetch("/api/cloudinary/sign", { method: "POST" });
  if (!sigRes.ok) {
    const body = await sigRes.json().catch(() => ({}));
    throw new Error(body.error || "Could not start upload.");
  }
  const sig = await sigRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);

  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    { method: "POST", body: fd }
  );
  if (!upRes.ok) {
    throw new Error(`Upload failed for "${file.name}".`);
  }
  const result = await upRes.json();
  return {
    publicId: result.public_id,
    url: result.secure_url,
    resourceType: result.resource_type,
    originalFilename: file.name,
    fileSize: result.bytes ?? file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

export default function NoteForm({
  noteId,
  initialTitle = "",
  initialContent = "",
}: {
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
}) {
  const isEdit = Boolean(noteId);
  const [state, formAction] = useActionState(saveNoteAction, initial);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft autosave to localStorage for NEW notes only.
  useEffect(() => {
    if (isEdit) return;
    const savedTitle = localStorage.getItem("note_draft_title");
    const savedContent = localStorage.getItem("note_draft_content");
    if (savedTitle && !initialTitle) setTitle(savedTitle);
    if (savedContent && !initialContent) setContent(savedContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  useEffect(() => {
    if (isEdit) return;
    localStorage.setItem("note_draft_title", title);
    localStorage.setItem("note_draft_content", content);
  }, [title, content, isEdit]);

  function syncFileNames() {
    const files = fileInputRef.current?.files;
    setSelectedFiles(files ? Array.from(files).map((f) => f.name) : []);
    setUploadError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);

    if (!title.trim()) return setUploadError("Title is required");
    if (!content.trim()) return setUploadError("Content is required");

    const files = Array.from(fileInputRef.current?.files ?? []);

    // Validate before uploading anything.
    for (const f of files) {
      const check = validateUploadFile(f);
      if (!check.valid) {
        setUploadError(`File "${f.name}": ${check.error}`);
        return;
      }
    }

    let uploaded: UploadedAttachment[] = [];
    if (files.length > 0) {
      setUploading(true);
      try {
        uploaded = await Promise.all(files.map(uploadFile));
      } catch (err) {
        setUploading(false);
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
        return;
      }
      setUploading(false);
    }

    if (!isEdit) {
      localStorage.removeItem("note_draft_title");
      localStorage.removeItem("note_draft_content");
    }

    const fd = new FormData();
    if (noteId) fd.append("id", noteId);
    fd.append("title", title);
    fd.append("content", content);
    fd.append("uploaded_attachments", JSON.stringify(uploaded));

    startTransition(() => formAction(fd));
  }

  const busy = uploading || isPending;

  return (
    <form onSubmit={handleSubmit} className="glass p-6 sm:p-10">
      {(uploadError || state.error) && (
        <div className="alert alert-error">❌ {uploadError || state.error}</div>
      )}

      <div className="mb-8">
        <label htmlFor="title" className="label">
          📝 Note Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title for your note…"
          className="input"
        />
      </div>

      <div className="mb-8">
        <label htmlFor="content" className="label">
          📄 Note Content
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={15}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your note content here…"
          className="input min-h-[300px] resize-y leading-relaxed"
        />
      </div>

      <div className="mb-8">
        <label className="label">📎 Add Attachments</label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (fileInputRef.current) {
              fileInputRef.current.files = e.dataTransfer.files;
              syncFileNames();
            }
          }}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
            dragOver
              ? "border-brand-start bg-brand-start/10"
              : "border-slate-300 bg-slate-50 hover:border-brand-start hover:bg-brand-start/5"
          }`}
        >
          {selectedFiles.length > 0 ? (
            <>
              <div className="mb-2 text-5xl">✅</div>
              <div className="text-slate-600">
                <strong>
                  {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
                </strong>
                <br />
                <small>{selectedFiles.join(", ")}</small>
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 text-5xl text-slate-400">📁</div>
              <div className="text-slate-500">
                <strong>Drag and drop files here</strong> or click to browse
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf"
            onChange={syncFileNames}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <small className="mt-2 block text-xs text-slate-500">
          📋 Images (JPG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX, TXT), Spreadsheets (XLS,
          XLSX, CSV) · 💾 Max 10MB each · uploaded directly to Cloudinary
        </small>
      </div>

      <div className="flex flex-col justify-end gap-3 border-t-2 border-slate-100 pt-6 sm:flex-row">
        <Link href="/dashboard" className="btn btn-secondary">
          ❌ Cancel
        </Link>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {uploading
            ? "Uploading files…"
            : isPending
              ? isEdit
                ? "Updating…"
                : "Creating…"
              : isEdit
                ? "💾 Update Note"
                : "✨ Create Note"}
        </button>
      </div>
    </form>
  );
}
