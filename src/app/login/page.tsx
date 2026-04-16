"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, signInWithGoogle } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface via-surface-raised to-surface-overlay">
      <div className="card w-full max-w-sm shadow-soft-md mx-4">
        <h1 className="font-display text-xl font-bold text-text-primary text-center">
          Jacker
        </h1>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 text-status-rejected text-sm p-3">
            {error}
          </div>
        )}

        <form className="login-form mt-6 space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            formAction={handleLogin}
          >
            Sign In
          </Button>
        </form>

        <div className="login-divider mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="demo-button w-full"
            onClick={() => { window.location.href = "/demo-login"; }}
          >
            Try the Demo
          </Button>
        </form>
      </div>
    </main>
  );
}
