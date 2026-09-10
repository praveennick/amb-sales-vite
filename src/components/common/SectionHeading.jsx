export default function SectionHeading({
  icon: Icon,
  children,
  tone = "violet",
}) {
  const tones = {
    violet: "from-violet-500 to-indigo-600",
    cyan: "from-cyan-400 to-blue-600",
    pink: "from-fuchsia-500 to-pink-600",
    amber: "from-amber-400 to-orange-500",
  };
  return (
    <h2 className="mb-5 flex items-center gap-3 text-base font-semibold tracking-tight">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${tones[tone]} text-white shadow-sm`}
      >
        <Icon aria-hidden="true" />
      </span>
      {children}
    </h2>
  );
}
