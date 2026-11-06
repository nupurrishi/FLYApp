import { ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthLink } from "@/components/auth/parts";
import { safeReturnTo } from "@/lib/authReturnTo";

/**
 * Public self-registration is intentionally disabled.
 * Admins provision accounts and assign roles before a team member signs in.
 */
export function RegisterPage() {
  const returnTo = safeReturnTo();

  return (
    <AuthLayout
      title="Access by invitation"
      subtitle="FLYApp accounts are created by the Fly Showcase production team."
    >
      <div className="rounded-sm border border-brand-line bg-white p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="font-heading text-2xl font-medium text-brand-black">
          Your account is managed by production
        </h2>
        <p className="mt-3 text-base leading-relaxed text-black/65">
          Models, designers and managers receive their sign-in access from an
          administrator. Please contact the production team if you need an account
          or believe you should already have access.
        </p>
      </div>
      <AuthLink
        to="/login"
        returnTo={returnTo}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-none bg-brand-black px-4 text-sm font-medium tracking-wide text-white transition hover:bg-brand-purple"
      >
        Back to sign in
      </AuthLink>
    </AuthLayout>
  );
}
