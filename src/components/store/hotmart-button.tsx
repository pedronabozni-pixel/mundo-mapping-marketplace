"use client";

import { trackPixelEvent } from "@/lib/pixel";

type Props = {
  href: string;
  label: string;
  productName: string;
  className: string;
};

export function HotmartButton({ href, label, productName, className }: Props) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => trackPixelEvent("InitiateCheckout", { product_name: productName })}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}
