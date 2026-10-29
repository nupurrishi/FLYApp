export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-7 border-b border-brand-line pb-5 lg:mb-9 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="label-eyebrow text-brand-purple">{eyebrow}</p>}
          <h1 className="mt-1.5 font-heading text-[30px] font-medium leading-tight text-brand-black sm:text-[36px]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-black/55">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}