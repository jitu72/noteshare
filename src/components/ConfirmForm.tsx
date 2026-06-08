"use client";

export default function ConfirmForm({
  action,
  message,
  className,
  hidden,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message?: string;
  className?: string;
  hidden?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (message && !window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      {children}
    </form>
  );
}
