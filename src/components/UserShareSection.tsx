"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { shareWithUserAction, type ShareState } from "@/actions/sharing";
import SubmitButton from "@/components/SubmitButton";

const initial: ShareState = {};

interface UserResult {
  id: string;
  username: string;
  email: string;
}

export default function UserShareSection({ noteId }: { noteId: string }) {
  const [state, formAction] = useActionState(shareWithUserAction, initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 2 || selected?.username === query) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = (await res.json()) as UserResult[];
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  // Reset selection after a successful share.
  useEffect(() => {
    if (state.success) {
      setSelected(null);
      setQuery("");
    }
  }, [state.success]);

  return (
    <section className="glass mb-6 p-6 sm:p-8">
      <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-800">
        👥 Share with Specific Users
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Share this note with registered users and control their permissions.
      </p>

      {state.error && <div className="alert alert-error">{state.error}</div>}
      {state.success && <div className="alert alert-success">{state.success}</div>}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="note_id" value={noteId} />
        <input type="hidden" name="share_with_user_id" value={selected?.id ?? ""} />

        <div className="relative">
          <label className="label">Search for users</label>
          <input
            type="text"
            value={query}
            autoComplete="off"
            placeholder="Type username or email…"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            className="input"
          />
          {open && (
            <div className="absolute z-10 max-h-52 w-full overflow-y-auto rounded-b-lg border-2 border-t-0 border-brand-start bg-white shadow-lg">
              {results.length > 0 ? (
                results.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      setSelected(u);
                      setQuery(u.username);
                      setOpen(false);
                    }}
                    className="block w-full border-b border-slate-100 p-3 text-left hover:bg-slate-50"
                  >
                    <strong>{u.username}</strong>
                    <br />
                    <small className="text-slate-500">{u.email}</small>
                  </button>
                ))
              ) : (
                <div className="p-3 text-slate-500">No users found</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="label">Permission Level</label>
          <select name="permission" className="input" defaultValue="read">
            <option value="read">Read Only</option>
            <option value="edit">Read &amp; Edit</option>
          </select>
        </div>

        <SubmitButton className="btn btn-accent" pendingText="Sharing…">
          🤝 Share Note
        </SubmitButton>
        {!selected && (
          <p className="text-xs text-slate-400">Select a user from the search results first.</p>
        )}
      </form>
    </section>
  );
}
