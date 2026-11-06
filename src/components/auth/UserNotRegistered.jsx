import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function UserNotRegistered() {
  const { logout } = useAuth();
  return (
    <AuthLayout icon={UserX} title="Profile not available" subtitle="We couldn't find a valid FLYApp profile for this account.">
      <p className="mb-6 text-center text-sm text-foreground">
        Please sign out and try again. If the problem continues, contact the FLYApp owner.
      </p>
      <Button variant="outline" className="h-12 w-full font-medium" onClick={logout}>
        Sign out
      </Button>
    </AuthLayout>
  );
}
