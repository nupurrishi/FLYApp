import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";

const labelClass = "label-eyebrow text-black/45";

// The /login page. ?returnTo= (or the platform's ?from_url=) is where the visitor
// goes after signing in — the login gate and the MCP consent page send people here with it.
export function LoginPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setBusy(true);
    try {
      const result = await authClient.signIn.email({ email: email.trim(), password, callbackURL: returnTo });
      if (result.error) throw new Error(result.error.message || "We couldn't sign you in.");
      // A hard redirect: the app re-initializes with the new session.
      window.location.href = returnTo;
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
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email" className={labelClass}>
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-none border-brand-line bg-white"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className={labelClass}>
              Password
            </Label>
            <AuthLink
              to="/forgot-password"
              returnTo={returnTo}
              className="text-xs text-brand-purple underline-offset-4 hover:underline"
            >
              Forgot password?
            </AuthLink>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-none border-brand-line bg-white pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-black/40 transition hover:text-brand-purple"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Signing in…" className="h-12 w-full rounded-none bg-brand-black font-normal tracking-wide hover:bg-brand-purple">
          Sign in
        </SubmitButton>
      </form>
      <p className="mt-7 text-center text-sm text-black/55">
        New to Fly Showcase?{" "}
        <AuthLink to="/register" returnTo={returnTo} className="font-medium text-brand-purple hover:underline">
          Create an account
        </AuthLink>
      </p>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-black/35">
        Team members are added to events by the production team. Accounts have no event access until invited.
      </p>
    </AuthLayout>
  );
}
