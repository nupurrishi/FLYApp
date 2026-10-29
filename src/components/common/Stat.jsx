export default function Stat({ label, value, hint, accent = false }) {
  return (
    <div className="border border-brand-line bg-white px-4 py-4">
      <p className="label-eyebrow text-black/40">{label}</p>
      <p
        className={`mt-2 font-heading text-[30px] leading-none ${
          accent ? "text-brand-purple" : "text-brand-black"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11px] text-black/45">{hint}</p>}
    </div>
  );
}