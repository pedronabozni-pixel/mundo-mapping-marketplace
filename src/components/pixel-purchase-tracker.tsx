"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export default function PixelPurchaseTracker({
  pedidoId,
  valor,
  produtoNome,
}: {
  pedidoId: string;
  valor: string;
  produtoNome: string;
}) {
  useEffect(() => {
    const numericValue = parseFloat(valor || "0");
    if (isNaN(numericValue)) return;

    if (typeof window.fbq === "function") {
      window.fbq("track", "Purchase", {
        value: numericValue,
        currency: "BRL",
        content_name: produtoNome,
      });
    }

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: pedidoId,
          value: numericValue,
          currency: "BRL",
          items: [{ item_name: produtoNome }],
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
