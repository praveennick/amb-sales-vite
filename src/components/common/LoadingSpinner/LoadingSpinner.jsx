export default function LoadingSpinner() {
  return (
    <div
      role="status"
      className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500"
    >
      <span
        className="size-5 rounded-full border-2 border-slate-200 border-t-emerald-600 motion-safe:animate-spin"
        aria-hidden="true"
      />
      Loading…
    </div>
  );
}
