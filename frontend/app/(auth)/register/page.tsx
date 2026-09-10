"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { register, login, getMe } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    is_native_speaker: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      const token = await login({ email: form.email, password: form.password });
      const user = await getMe(token.access_token);
      setAuth(token.access_token, user);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold text-stone-800">
        Create account
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Username"
          placeholder="your_username"
          value={form.username}
          onChange={(e) => update("username", e.target.value)}
          required
          autoComplete="username"
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
        />

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={form.is_native_speaker}
            onChange={(e) => update("is_native_speaker", e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 accent-amber-600"
          />
          I am a native Nuer speaker
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-amber-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
