import { ReactNode } from "react";
import { InfluencerFrame } from "@/components/mundo-mapping/influencer-frame";

export default function MundoMappingInfluenciadoresLayout({
  children
}: {
  children: ReactNode;
}) {
  return <InfluencerFrame>{children}</InfluencerFrame>;
}
