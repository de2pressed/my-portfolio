"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("jayantdahiya1204@gmail.com");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

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
        throw new Error(payload.error ?? "Login failed");
      }

      router.push("/admin/panel");
    } catch (error) {
      console.warn("Admin login failed.", error);
      setStatus(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <main className="section-wrap flex min-h-screen items-center justify-center pt-20">
      <div className="glass-panel w-full max-w-lg rounded-[36px] p-8 md:p-10">
        <p className="glass-chip w-fit">Hidden admin access</p>
        <h1 className="mt-5 text-4xl font-semibold text-ink md:text-5xl">Secure the studio.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/68">
          Sign in with the admin account connected to Supabase Auth. In local preview mode, the
          demo credentials from `.env.local` are used instead.
        </p>

        <form className="mt-8 space-y-4" onSubmit={submit}>
          <input
            className="w-full rounded-[20px] border border-white/28 bg-white/22 px-4 py-3 text-sm"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />
          <input
            className="w-full rounded-[20px] border border-white/28 bg-white/22 px-4 py-3 text-sm"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
          <button className="glass-button w-full justify-center" type="submit">
            Enter panel
          </button>
          {status ? <p className="text-sm text-ink/64">{status}</p> : null}
        </form>
      </div>
    </main>
  );
}
