"use client";

import { Shield, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("jayantdahiya1204@gmail.com");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [errorPulse, setErrorPulse] = useState(false);

  useEffect(() => {
    if (!errorPulse) {
      return;
    }

    const timer = window.setTimeout(() => setErrorPulse(false), 700);
    return () => window.clearTimeout(timer);
  }, [errorPulse]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Signing in...");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setErrorPulse(true);
        throw new Error(payload.error ?? "Login failed");
      }

      router.push("/admin/panel");
    } catch (error) {
      console.warn("Admin login failed.", error);
      setErrorPulse(true);
      setStatus(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute left-[8%] top-[10%] h-72 w-72 rounded-full bg-[rgba(var(--warm-rgb),0.22)] blur-3xl" />
        <div className="absolute right-[10%] top-[18%] h-96 w-96 rounded-full bg-[rgba(var(--lavender-rgb),0.18)] blur-3xl" />
        <div className="absolute bottom-[8%] left-[30%] h-80 w-80 rounded-full bg-[rgba(var(--teal-rgb),0.16)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 pt-20 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.aside
          className="relative overflow-hidden rounded-[44px] border border-white/18 bg-[rgba(255,255,255,0.12)] p-8 shadow-[0_30px_100px_rgba(52,36,22,0.16)] backdrop-blur-2xl md:p-10"
          initial={{ opacity: 0, x: -64, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent_40%),linear-gradient(145deg,rgba(var(--accent-rgb),0.12),transparent_50%)]" />
          <div className="relative space-y-8">
            <p className="glass-chip w-fit">Access wall</p>
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink/54">Restricted surface</p>
              <h1 className="max-w-xl text-5xl font-semibold leading-[0.92] text-ink md:text-7xl">
                Control room entry.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-ink/72 md:text-base">
                This panel is for content, moderation, and playback settings only. The public site
                never exposes these controls.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "Authentication gate",
                "Signed session cookie",
                "Supabase-backed edits",
              ].map((line) => (
                <div
                  className="flex items-center gap-3 rounded-[22px] border border-white/18 bg-[rgba(255,255,255,0.12)] px-4 py-3 text-sm text-ink/72"
                  key={line}
                >
                  <Lock className="h-4 w-4 text-ink/58" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        <motion.section
          className={`glass-panel relative overflow-hidden rounded-[44px] border border-white/18 bg-[rgba(255,255,255,0.12)] p-6 shadow-[0_34px_120px_rgba(52,36,22,0.2)] backdrop-blur-2xl md:p-8 ${
            errorPulse ? "border-rose-300/45 ring-1 ring-rose-300/20" : ""
          }`}
          animate={errorPulse ? { x: [0, -16, 12, -10, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(var(--accent-rgb),0.16),transparent_35%),linear-gradient(140deg,rgba(255,255,255,0.3),transparent_30%)]" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-[18px] border ${
                  errorPulse
                    ? "border-rose-300/50 bg-rose-100/24 text-rose-950"
                    : "border-white/18 bg-[rgba(255,255,255,0.14)] text-ink"
                }`}
              >
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-ink/50">Hidden admin access</p>
                <h2 className="mt-1 text-3xl font-semibold text-ink md:text-4xl">Secure the studio.</h2>
              </div>
            </div>

            <p
              className={`mt-5 rounded-[22px] border px-4 py-4 text-sm leading-7 ${
                errorPulse
                  ? "border-rose-300/40 bg-rose-100/24 text-rose-950"
                  : "border-white/18 bg-[rgba(255,255,255,0.12)] text-ink/72"
              }`}
            >
              Sign in with the admin account connected to Supabase Auth. In local preview mode, the
              demo credentials from `.env.local` are used instead.
            </p>

            {errorPulse ? (
              <div className="mt-4 rounded-[18px] border border-rose-300/40 bg-rose-100/26 px-4 py-3 text-xs uppercase tracking-[0.28em] text-rose-950">
                Access denied
              </div>
            ) : null}

            <form className="mt-7 space-y-4" onSubmit={submit}>
              <input
                className={`w-full rounded-[20px] border px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/42 ${
                  errorPulse
                    ? "border-rose-300/50 bg-rose-50/24 text-ink"
                    : "border-white/20 bg-[rgba(255,255,255,0.14)] text-ink"
                }`}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                required
                type="email"
                value={email}
              />
              <input
                className={`w-full rounded-[20px] border px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/42 ${
                  errorPulse
                    ? "border-rose-300/50 bg-rose-50/24 text-ink"
                    : "border-white/20 bg-[rgba(255,255,255,0.14)] text-ink"
                }`}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                type="password"
                value={password}
              />
              <button
                className={`glass-button w-full justify-center transition-colors ${
                  errorPulse ? "border-rose-300/40" : ""
                }`}
                type="submit"
              >
                Enter panel
              </button>
              {status ? <p className={`text-sm ${errorPulse ? "text-rose-800" : "text-ink/64"}`}>{status}</p> : null}
            </form>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
