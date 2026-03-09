"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function StoreAdminLoginForm({ nextPath = "/loja/admin" }: { nextPath?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/loja-admin/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setLoading(false);

    if (!response.ok) {
      setError("Senha inválida.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block text-sm text-zinc-300" htmlFor="password">
        Senha do painel
      </label>
      <input
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-amber-400"
        id="password"
        name="password"
        placeholder="Digite a senha"
        type="password"
      />
      <button
        className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Entrando..." : "Acessar Painel"}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
