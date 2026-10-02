export default function LoadingSpinner({ fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center px-4 py-8 ${
        fullScreen
          ? "fixed inset-0 z-[100] min-h-dvh bg-linear-to-br from-indigo-50 via-slate-50 to-fuchsia-50"
          : "min-h-[50vh]"
      }`}
    >
      <span className="sr-only">Loading</span>
      <div className="flex flex-col items-center" aria-hidden="true">
        <div className="relative flex size-24 items-center justify-center">
          <span className="absolute inset-1 rounded-full bg-violet-400/20 blur-xl motion-safe:animate-pulse" />
          <span className="absolute inset-0 rounded-full border border-violet-200/80" />
          <span className="absolute inset-1 rounded-full border-2 border-transparent border-t-violet-600 border-r-fuchsia-400 motion-safe:animate-spin motion-reduce:border-violet-300" />
          <span className="absolute inset-3 rounded-full border border-dashed border-indigo-300 motion-safe:animate-[spin_3s_linear_infinite_reverse]" />
          <span className="relative flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-violet-500/30 ring-4 ring-white">
            A
          </span>
        </div>

        <div className="mt-5 flex items-center gap-1.5 text-sm font-medium tracking-wide text-slate-600">
          <span>Loading your workspace</span>
          <span className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-1 rounded-full bg-violet-500 motion-safe:animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </div>
        <span className="mt-2 text-xs text-slate-400">
          Preparing the latest business view
        </span>
      </div>
    </div>
  );
}
