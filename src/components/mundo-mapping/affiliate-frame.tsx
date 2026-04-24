"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AffiliateShell, InfluencerShell } from "@/components/mundo-mapping/affiliate-ui";
import { ProductStoreProvider } from "@/components/mundo-mapping/product-store";

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function AffiliateFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);
  const isInfluencerArea = normalizedPath.startsWith("/mundo-mapping/afiliados/parceiro");

  return (
    <ProductStoreProvider>
      {isInfluencerArea ? (
        <InfluencerShell currentPath={normalizedPath}>{children}</InfluencerShell>
      ) : (
        <AffiliateShell currentPath={normalizedPath}>{children}</AffiliateShell>
      )}
    </ProductStoreProvider>
  );
}
