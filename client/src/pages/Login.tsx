import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { facility } from "@/data/mockData";

export default function Login() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const result = mode === "sign-in" ? await signIn(email, password) : await signUp(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "sign-up") {
      setInfo("Account created. Check your email to confirm, then sign in.");
      setMode("sign-in");
      return;
    }

    navigate("/overview");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="instrument-label mb-2">{facility.location}</p>
          <h1 className="heading-xl text-foreground">SolarGrid</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to view {facility.name}'s live operating console.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface shadow-sm p-6 space-y-5"
        >
          <div className="flex rounded-lg bg-surface-soft p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                mode === "sign-in" ? "bg-surface text-foreground shadow-sm" : "text-text-secondary"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                mode === "sign-up" ? "bg-surface text-foreground shadow-sm" : "text-text-secondary"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
