import { Lock, Mail, UserPlus, UserRound } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";
import { supabase } from "@/lib/supabase";

export function RegisterPage() {
  const returnTo = safeReturnTo();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("model");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!["model", "designer"].includes(role)) {
      setError("Choose Model or Designer to create an account.");
      return;
    }

    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: fullName.trim(), role },
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        const { error: profileError } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
        if (profileError) throw profileError;
        window.location.assign(returnTo);
        return;
      }

      setNotice("Your account has been created. Check your email to confirm your address, then sign in. If you want accounts to work immediately without email confirmation, the Supabase project owner must turn off email confirmations in Authentication settings.");
    } catch (err) {
      setError(err?.message || "We couldn't create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={UserPlus} title="Create your account" subtitle="Join the FLYApp production workspace as a model or designer.">
      <AuthError>{error}</AuthError>
      {notice && <div role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-800">{notice}</div>}
      <form onSubmit={register} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-name">Full name</Label>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-name" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-12 pl-10" required disabled={busy} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-role">I am registering as</Label>
          <select id="register-role" value={role} onChange={(event) => setRole(event.target.value)} className="h-12 w-full border border-brand-line bg-white px-3 text-sm" disabled={busy}>
            <option value="model">Model</option>
            <option value="designer">Designer</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" required disabled={busy} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pl-10" minLength={8} required disabled={busy} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <Input id="register-confirm" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12" required disabled={busy} />
        </div>
        <SubmitButton busy={busy} busyLabel="Creating account...">Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <AuthLink to="/login" returnTo={returnTo}>Sign in</AuthLink>
      </p>
      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        Manager and Admin access cannot be selected here. Those accounts are provisioned separately by the owner.
      </p>
    </AuthLayout>
  );
}
