export default function FormField({ label, hint, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="label-eyebrow mb-1.5 block text-black/45">
        {label}
        {required && <span className="ml-1 text-brand-purple">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-black/35">{hint}</span>}
    </label>
  );
}