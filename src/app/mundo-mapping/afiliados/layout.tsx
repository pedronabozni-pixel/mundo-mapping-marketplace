import { ReactNode } from "react";
import { AffiliateFrame } from "@/components/mundo-mapping/affiliate-frame";

export default function MundoMappingAffiliadosLayout({
  children
}: {
  children: ReactNode;
}) {
  return <AffiliateFrame>{children}</AffiliateFrame>;
}
