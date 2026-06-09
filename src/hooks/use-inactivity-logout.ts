"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Logout automático por INATIVIDADE (não é tempo absoluto de sessão).
// Qualquer interação do usuário reseta o contador; após 2h sem atividade,
// faz signOut() e redireciona para a tela de login da área.
const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 horas

// Throttle: processa o reset do timer no máximo 1x a cada 30s. Evita reagir a
// cada pixel de mousemove/scroll — a precisão do limite de 2h não sofre.
const THROTTLE_MS = 30 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

/**
 * Arma um timer de inatividade enquanto houver sessão ativa. Só roda no client.
 *
 * @param redirectTo rota de login da área (ex: "/mundo-mapping/empresa/login").
 *   Recebe `?reason=inactivity` para a tela poder exibir um aviso, se quiser.
 */
export function useInactivityLogout(redirectTo: string = "/") {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supabase = createClient();
    let active = false; // timer + listeners armados?
    let mounted = true;

    async function handleLogout() {
      try {
        await supabase.auth.signOut();
      } catch {
        // Mesmo se o signOut falhar, segue para o login — a sessão local some.
      }
      const sep = redirectTo.includes("?") ? "&" : "?";
      window.location.href = `${redirectTo}${sep}reason=inactivity`;
    }

    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function armTimer() {
      clearTimer();
      timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
    }

    function onActivity() {
      const now = Date.now();
      if (now - lastResetRef.current < THROTTLE_MS) return; // throttle
      lastResetRef.current = now;
      armTimer();
    }

    function start() {
      if (active) return;
      active = true;
      lastResetRef.current = Date.now();
      armTimer();
      ACTIVITY_EVENTS.forEach((ev) =>
        window.addEventListener(ev, onActivity, { passive: true }),
      );
    }

    function stop() {
      if (!active) return;
      active = false;
      clearTimer();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
    }

    // Só ativa quando há sessão — evita redirect loop na própria tela de login.
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) start();
    });

    // Re-arma ao logar / desarma ao deslogar manualmente.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) start();
      else stop();
    });

    return () => {
      mounted = false;
      stop();
      sub.subscription.unsubscribe();
    };
  }, [redirectTo]);
}
