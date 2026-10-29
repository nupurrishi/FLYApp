export default function Wordmark({ tone = "light", showTagline = false }) {
  const ink = tone === "light" ? "text-white" : "text-brand-black";
  const sub = tone === "light" ? "text-brand-gold" : "text-brand-purple";
  return (
    <span className="inline-flex flex-col leading-none">
      <span className={`font-heading text-[26px] font-semibold tracking-[0.34em] ${ink}`}>FLY</span>
      <span className={`label-eyebrow mt-1 ${sub}`} style={{ letterSpacing: "0.34em" }}>
        Showcase
      </span>
      {showTagline && (
        <span className={`mt-3 text-[11px] italic ${tone === "light" ? "text-white/50" : "text-black/45"}`}>
          First Love Yourself
        </span>
      )}
    </span>
  );
}