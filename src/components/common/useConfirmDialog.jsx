import { useCallback, useEffect, useRef, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function useConfirmDialog() {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback(
    (next) =>
      new Promise((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );
  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);
  useEffect(() => () => resolver.current?.(false), []);
  const confirmationDialog = options ? (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/55 p-5 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && close(false)}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <FaExclamationTriangle aria-hidden="true" />
        </span>
        <h2 id="confirmation-title" className="mt-5 text-xl font-semibold">
          {options.title}
        </h2>
        <p id="confirmation-description" className="mt-2 text-sm leading-relaxed text-slate-600">
          {options.message}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn-secondary justify-center" onClick={() => close(false)} autoFocus>
            {options.cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            className={
              options.danger
                ? "btn-primary justify-center from-red-600 to-rose-600"
                : options.success
                  ? "btn-success justify-center"
                  : "btn-primary justify-center"
            }
            onClick={() => close(true)}
          >
            {options.confirmLabel || "Confirm"}
          </button>
        </div>
      </section>
    </div>
  ) : null;
  return { confirm, confirmationDialog };
}
