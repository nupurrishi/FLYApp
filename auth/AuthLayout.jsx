import Wordmark from "@/components/brand/Wordmark";

// Full-screen shell shared by the sign-in, register and password pages.
export function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen w-full bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-black lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&q=80)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/70 to-brand-black/30" aria-hidden="true" />
        <div className="relative">
          <Wordmark tone="light" showTagline />
        </div>
        <div className="relative max-w-md">
          <div className="mb-6 h-px w-12 bg-brand-gold" />
          <h2 className="font-heading text-4xl font-light leading-[1.1] text-white">
            Where the runway meets
            <span className="italic text-brand-gold"> the production room.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            Call times, fittings, looks and live show control — one workspace for the models,
            designers and producers behind every Fly Showcase event.
          </p>
        </div>
        <p className="relative label-eyebrow text-white/35">Est. 2020 · New York · Dallas · Las Vegas</p>
      </aside>

      <main className="flex min-h-screen flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm animate-rise">
          <div className="mb-10 lg:hidden">
            <Wordmark tone="dark" />
          </div>
          <p className="label-eyebrow text-brand-purple">Fly Showcase Productions</p>
          <h1 className="mt-3 font-heading text-[34px] font-medium leading-tight text-brand-black">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-black/55">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-black/55">{footer}</div>}
        </div>
      </main>
    </div>
  );
}