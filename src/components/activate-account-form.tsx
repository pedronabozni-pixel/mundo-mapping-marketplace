"use client";

import { FormEvent, useState } from "react";

type Props = {
  token: string;
};

export function ActivateAccountForm({ token }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (newPassword.length < 8) {
      setMessage("A senha precisa ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/activate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword })
    });
    setLoading(false);

    if (!response.ok) {
      setMessage("Link inválido ou expirado. Solicite um novo acesso.");
      return;
    }

    setDone(true);
    setMessage("Conta ativada com sucesso. Você já pode entrar.");
  }

  return (
    <form className="card w-full max-w-md space-y-4" onSubmit={onSubmit}>
      <h1 className="text-2xl font-bold">Ativar conta</h1>
      <p className="text-sm text-muted">Defina sua senha para acessar a plataforma.</p>

      <div>
        <label className="mb-1 block text-sm">Nova senha</label>
        <input
          className="input"
          minLength={8}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          type="password"
          value={newPassword}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm">Confirmar senha</label>
        <input
          className="input"
          minLength={8}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn w-full" disabled={loading || done} type="submit">
        {loading ? "Ativando..." : done ? "Conta ativada" : "Ativar conta"}
      </button>

      <a className="text-sm text-muted underline underline-offset-4" href="/login">
        Ir para login
      </a>
    </form>
  );
}
