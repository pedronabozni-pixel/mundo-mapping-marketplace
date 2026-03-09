"use client";

import { useEffect } from "react";
import { trackPixelEvent } from "@/lib/pixel";

export function ProductViewTracker({ productName }: { productName: string }) {
  useEffect(() => {
    trackPixelEvent("ViewContent", { product_name: productName });
  }, [productName]);

  return null;
}
