import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";
import { supabase } from "@/lib/supabase";

const labelClass = "label-eyebrow text-black/45";
const ALLOWED_ROLES = ["model", "designer", "admin"];

export function LoginPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
        await supabase.auth.signOut();
        throw new Error("Your account profile is missing or does not have an assigned role. Please contact the FLYApp team.");
      }
      window.location.assign(returnTo);
    } catch (err) {
      setError(err?.message || "We couldn't sign you in. Check your email and password.");
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in to your workspace"
      subtitle="Access your call times, fittings, looks and show-day information."
    >
      <AuthError>{error}</AuthError>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email" className={labelClass}>Email</Label>
          <Input id="login-email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-none border-brand-line bg-white" required disabled={busy} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className={labelClass}>Password</Label>
            <AuthLink to="/forgot-password" returnTo={returnTo} className="text-xs text-brand-purple underline-offset-4 hover:underline">Forgot password?</AuthLink>
          </div>
          <div className="relative">
            <Input id="login-password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-none border-brand-line bg-white pr-12" required disabled={busy} />
            <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-black/40 transition hover:text-brand-purple">
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Signing in…" className="h-12 w-full rounded-none bg-brand-black font-normal tracking-wide hover:bg-brand-purple">Sign in</SubmitButton>
      </form>
      <p className="mt-7 text-center text-sm text-black/55">
        New to FLYApp?{" "}
        <AuthLink to="/register" returnTo={returnTo} className="font-medium text-brand-purple hover:underline">Create an account</AuthLink>
      </p>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-black/35">
        Create a Model or Designer account. Admin accounts are created privately by the FLYApp owner.
      </p>
    </AuthLayout>
  );
}
