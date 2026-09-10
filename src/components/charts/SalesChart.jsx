import { useEffect, useRef, useState } from "react";
import { currency, displayDate, weekday } from "../../lib/format";
const colors = ["fill-violet-600", "fill-cyan-700", "fill-fuchsia-700"];
export default function SalesChart({ dates, series, label }) {
  const container = useRef(null);
  const [containerWidth, setContainerWidth] = useState(280);
  const [selected, setSelected] = useState(null);
  const selectedIndex = dates.indexOf(selected?.date);
  const selectedSeries = series.find((entry) => entry.name === selected?.name);
  const selectedValue = Number(selectedSeries?.data[selectedIndex]) || 0;
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setContainerWidth(entry.contentRect.width),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const labelWidth = Math.max(
    72,
    ...series.flatMap((entry) =>
      entry.data.map((value) => currency(value).length * 7 + 20),
    ),
  );
  const width = Math.max(280, containerWidth, dates.length * labelWidth + 60),
    height = 245,
    plotHeight = 170;
  const totals = dates.map((_, index) =>
    series.reduce(
      (sum, entry) => sum + Math.max(0, Number(entry.data[index]) || 0),
      0,
    ),
  );
  const negativeTotals = dates.map((_, index) =>
    series.reduce(
      (sum, entry) => sum + Math.min(0, Number(entry.data[index]) || 0),
      0,
    ),
  );
  const maximum = Math.max(1, ...totals);
  const minimum = Math.min(0, ...negativeTotals);
  const scale = plotHeight / (maximum - minimum);
  const baseline = 20 + maximum * scale;
  const step = (width - 60) / Math.max(1, dates.length);
  return (
    <div>
      <div
        ref={container}
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={label + " chart, scroll horizontally for more dates"}
      >
        <svg
          width={width}
          viewBox={`0 0 ${width} ${height}`}
          className="h-60 max-w-none"
          role="group"
          aria-label={
            label + ". Exact values are available in the data table below."
          }
        >
          {[0, 0.5, 1].map((tick) => (
            <g key={tick}>
              <line
                x1="50"
                x2={width}
                y1={190 - tick * plotHeight}
                y2={190 - tick * plotHeight}
                className="stroke-slate-100"
              />
              <text
                x="45"
                y={194 - tick * plotHeight}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {Math.round(
                  minimum + (maximum - minimum) * tick,
                ).toLocaleString("en-IN")}
              </text>
            </g>
          ))}
          <line
            x1="50"
            x2={width}
            y1={baseline}
            y2={baseline}
            className="stroke-slate-300"
          />
          {dates.map((date, index) => {
            let positiveOffset = 0,
              negativeOffset = 0;
            return (
              <g key={date}>
                {series.map((entry, seriesIndex) => {
                  const value = Number(entry.data[index]) || 0,
                    barHeight = Math.abs(value) * scale;
                  const y =
                    value >= 0
                      ? baseline - positiveOffset - barHeight
                      : baseline + negativeOffset;
                  if (value >= 0) positiveOffset += barHeight;
                  else negativeOffset += barHeight;
                  if (!value) return null;
                  const description = `${weekday(date)} ${displayDate(date)} · ${entry.name}: ${currency(value)}`;
                  return (
                    <g
                      key={entry.name}
                      role="button"
                      tabIndex={0}
                      aria-label={description}
                      aria-pressed={
                        selected?.date === date && selected?.name === entry.name
                      }
                      className="cursor-pointer outline-none focus:stroke-slate-900 focus:stroke-2"
                      onClick={() => setSelected({ date, name: entry.name })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected({ date, name: entry.name });
                        }
                      }}
                    >
                      <rect
                        x={55 + index * step}
                        y={y}
                        width={Math.max(2, step - 8)}
                        height={barHeight}
                        rx="2"
                        className={colors[seriesIndex % colors.length]}
                      >
                        <title>
                          {weekday(date)} {displayDate(date)} · {entry.name}:{" "}
                          {currency(entry.data[index])}
                        </title>
                      </rect>
                      {barHeight >= 18 && (
                        <text
                          x={55 + index * step + (step - 8) / 2}
                          y={y + barHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none fill-white stroke-none text-[11px] font-semibold"
                        >
                          {currency(value)}
                        </text>
                      )}
                    </g>
                  );
                })}
                {
                  <text
                    x={55 + index * step}
                    y="215"
                    className="fill-slate-500 text-[10px]"
                  >
                    <tspan
                      x={55 + index * step}
                      className="font-semibold fill-slate-600"
                    >
                      {weekday(date)}
                    </tspan>
                    <tspan x={55 + index * step} dy="15" className="text-[8px]">
                      {displayDate(date)}
                    </tspan>
                  </text>
                }
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Tap a bar to see its exact amount.
      </p>
      {selectedIndex >= 0 && selectedSeries && selectedValue !== 0 && (
        <div
          role="status"
          className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-950"
        >
          <div>
            <p className="text-xs">
              {weekday(selected.date)} {displayDate(selected.date)} ·{" "}
              {selected.name}
            </p>
            <p className="mt-1 font-bold tabular-nums">
              {currency(selectedValue)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss bar details"
            className="rounded-lg px-3 py-2 hover:bg-violet-100"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
        {series.map((entry, index) => (
          <span key={entry.name} className="flex items-center gap-2">
            <svg className="size-2.5" aria-hidden="true">
              <circle
                cx="5"
                cy="5"
                r="5"
                className={colors[index % colors.length]}
              />
            </svg>
            {entry.name}
          </span>
        ))}
      </div>
      <details className="mt-4 text-xs text-slate-500">
        <summary className="py-2">View exact values</summary>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left">
            <caption className="sr-only">{label} by date</caption>
            <thead>
              <tr>
                <th className="p-2">Date</th>
                {series.map((entry) => (
                  <th className="p-2" key={entry.name}>
                    {entry.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date, index) => (
                <tr key={date} className="border-t border-slate-100">
                  <th className="whitespace-nowrap p-2 font-normal">
                    {weekday(date)} {displayDate(date)}
                  </th>
                  {series.map((entry) => (
                    <td key={entry.name} className="p-2 tabular-nums">
                      {currency(entry.data[index])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
