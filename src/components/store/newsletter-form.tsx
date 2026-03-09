"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setMessage("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/loja/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = (await response.json()) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(data.message ?? "Não foi possível cadastrar agora.");
      return;
    }

    form.reset();
    setMessage("Pronto. Você entrou para a lista VIP.");
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Oferta exclusiva</p>
      <h3 className="mt-2 font-serif text-2xl text-zinc-100">Receba cupons e novos lançamentos</h3>
      <form className="mt-4 flex flex-col gap-3 md:flex-row" onSubmit={onSubmit}>
        <input
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-400"
          name="email"
          placeholder="Seu melhor e-mail"
          type="email"
        />
        <button
          className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Enviando..." : "Quero Desconto"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </section>
  );
}
