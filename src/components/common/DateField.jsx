import { FaRegCalendarAlt } from "react-icons/fa";
import { displayDate } from "../../lib/format";

// Keep the native calendar and validation, with a consistent visible date on Safari too.
export default function DateField({ className = "", ...props }) {
  return (
    <div className={`relative isolate w-full min-w-0 max-w-full ${className}`}>
      <input
        {...props}
        type="date"
        className="peer absolute inset-0 z-10 block size-full min-w-0 max-w-full cursor-pointer appearance-none rounded-xl opacity-0 disabled:cursor-not-allowed"
      />
      <div
        aria-hidden="true"
        className="field pointer-events-none flex items-center justify-between gap-2 overflow-hidden peer-focus-visible:border-violet-500 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500/20 peer-disabled:opacity-50"
      >
        <span className="min-w-0 whitespace-nowrap tabular-nums">
          {displayDate(props.value)}
        </span>
        <FaRegCalendarAlt className="shrink-0 text-violet-500" />
      </div>
    </div>
  );
}
