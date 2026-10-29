import { Lock, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { safeReturnTo } from "@/lib/authReturnTo";

export function RegisterPage() {
  const returnTo = safeReturnTo();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function register(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(), email: email.trim().toLowerCase(), password, callbackURL: returnTo,
      });
      if (result.error) throw new Error(result.error.message || "Registration failed.");
      setSent(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout icon={Mail} title="Check your email" subtitle="Verify your address to finish creating your account">
        <p className="text-center text-sm text-foreground">If the address is eligible, a verification link was sent to <strong>{email}</strong>. Follow the link, then sign in.</p>
        <p className="mt-6 text-center text-sm text-muted-foreground"><AuthLink to="/login" returnTo={returnTo}>Back to sign in</AuthLink></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title="Create your account" subtitle="Sign up to access your FLYApp event workspace">
      <AuthError>{error}</AuthError>
      <form onSubmit={register} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="register-name">Name</Label><Input id="register-name" autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-12" disabled={busy} required maxLength={160} /></div>
        <div className="space-y-2"><Label htmlFor="register-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" disabled={busy} required maxLength={254} /></div></div>
        <div className="space-y-2"><Label htmlFor="register-password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="register-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" disabled={busy} required minLength={8} maxLength={128} /></div></div>
        <div className="space-y-2"><Label htmlFor="register-confirm">Confirm password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="register-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 pl-10" disabled={busy} required minLength={8} maxLength={128} /></div></div>
        <SubmitButton busy={busy} busyLabel="Creating account...">Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <AuthLink to="/login" returnTo={returnTo}>Sign in</AuthLink></p>
    </AuthLayout>
  );
}
