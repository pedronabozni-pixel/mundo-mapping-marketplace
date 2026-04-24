"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { InfluencerShell } from "@/components/mundo-mapping/affiliate-ui";
import { ProductStoreProvider } from "@/components/mundo-mapping/product-store";

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function InfluencerFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ProductStoreProvider>
      <InfluencerShell currentPath={normalizePath(pathname)}>{children}</InfluencerShell>
    </ProductStoreProvider>
  );
}
