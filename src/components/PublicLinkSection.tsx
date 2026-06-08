"use client";

import { useActionState, useState } from "react";
import {
  generatePublicLinkAction,
  updateCustomUrlAction,
  disablePublicLinkAction,
  type ShareState,
} from "@/actions/sharing";
import SubmitButton from "@/components/SubmitButton";

const initial: ShareState = {};

export default function PublicLinkSection({
  noteId,
  isPublic,
  shareToken,
  origin,
}: {
  noteId: string;
  isPublic: boolean;
  shareToken: string | null;
  origin: string;
}) {
  const [genState, genAction] = useActionState(generatePublicLinkAction, initial);
  const [updState, updAction] = useActionState(updateCustomUrlAction, initial);
  const [copied, setCopied] = useState(false);

  const publicUrl = shareToken ? `${origin}/s/${shareToken}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="glass mb-6 p-6 sm:p-8">
      <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-800">
        🌐 Public Link Sharing
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Anyone with the link can view this note (no login required).
      </p>

      {genState.error && <div className="alert alert-error">{genState.error}</div>}
      {genState.success && <div className="alert alert-success">{genState.success}</div>}
      {updState.error && <div className="alert alert-error">{updState.error}</div>}
      {updState.success && <div className="alert alert-success">{updState.success}</div>}

      {isPublic && shareToken ? (
        <>
          <div className="mb-4 break-all rounded-lg border-2 border-slate-200 bg-slate-50 p-4 font-mono text-sm">
            <strong className="text-slate-800">🔗 Your Public Link:</strong>
            <br />
            <span className="font-semibold text-brand-start">{publicUrl}</span>
            <button onClick={copy} className="btn btn-secondary btn-sm ml-3 align-middle">
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>

          <form
            action={updAction}
            className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4"
          >
            <input type="hidden" name="note_id" value={noteId} />
            <strong className="text-slate-800">🎨 Customize Your URL</strong>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-slate-500">{origin}/s/</span>
              <input
                type="text"
                name="custom_slug"
                defaultValue={shareToken}
                pattern="[a-zA-Z0-9_-]{3,20}"
                title="3-20 characters: letters, numbers, hyphens, underscores only"
                className="input flex-1 font-mono"
                required
              />
              <SubmitButton className="btn btn-primary" pendingText="Updating…">
                ✨ Update
              </SubmitButton>
            </div>
            <small className="mt-2 block italic text-slate-500">
              💡 3-20 characters (letters, numbers, hyphens, underscores)
            </small>
          </form>

          <form action={disablePublicLinkAction} className="mt-4">
            <input type="hidden" name="note_id" value={noteId} />
            <button type="submit" className="btn btn-danger">
              🚫 Disable Public Sharing
            </button>
          </form>
        </>
      ) : (
        <form action={genAction} className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
          <input type="hidden" name="note_id" value={noteId} />
          <label className="label">🎯 Custom URL (optional)</label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-slate-500">{origin}/s/</span>
            <input
              type="text"
              name="custom_slug"
              placeholder="your-custom-url"
              pattern="[a-zA-Z0-9_-]{3,20}"
              title="3-20 characters: letters, numbers, hyphens, underscores only"
              className="input flex-1 font-mono"
            />
          </div>
          <small className="mb-4 mt-2 block italic text-slate-500">
            💡 Leave empty for a random URL or create your own memorable link
          </small>
          <SubmitButton className="btn btn-accent" pendingText="Generating…">
            🚀 Generate Public Link
          </SubmitButton>
        </form>
      )}
    </section>
  );
}
