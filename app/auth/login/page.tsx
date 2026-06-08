"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Car className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black">Del Auto</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin panel</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@delauto.ba"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {state.error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2.5 rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Prijava..." : "Prijavi se"}
          </Button>
        </form>
      </div>
    </div>
  );
}
