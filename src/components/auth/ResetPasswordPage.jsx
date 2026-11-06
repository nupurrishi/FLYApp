import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("This reset link has expired or is invalid. Request a new one.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setComplete(true);
    } catch (err) {
      setError(err?.message || "Failed to reset your password.");
    } finally {
      setBusy(false);
    }
  }

  if (complete) {
    return (
      <AuthLayout title="Password updated" subtitle="Your password has been changed successfully.">
        <p className="text-sm leading-relaxed text-foreground">You can now sign in with your new password.</p>
        <Link to="/login" className="mt-6 flex h-12 w-full items-center justify-center bg-brand-black text-sm text-white hover:bg-brand-purple">Return to sign in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={AlertTriangle} title="Choose a new password" subtitle="Create a new password for your FLYApp account.">
      <AuthError>{error}</AuthError>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-password">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="reset-password" type="password" autoComplete="new-password" autoFocus placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pl-10" minLength={8} required disabled={busy} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reset-confirm">Confirm password</Label>
          <Input id="reset-confirm" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12" required disabled={busy} />
        </div>
        <SubmitButton busy={busy} busyLabel="Updating password...">Update password</SubmitButton>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">If your link has expired, <Link to="/forgot-password" className="text-brand-purple underline">request another reset email</Link>.</p>
    </AuthLayout>
  );
}
