import type { Metadata } from "next";
import { getSiteContent } from "@/lib/store-data";

export const metadata: Metadata = {
  title: "Sobre"
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const siteContent = await getSiteContent();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-serif text-4xl">{siteContent.about.title}</h1>
      <p className="text-zinc-300">{siteContent.about.paragraph1}</p>
      <p className="text-zinc-300">{siteContent.about.paragraph2}</p>
      <p className="text-zinc-300">{siteContent.about.paragraph3}</p>
    </div>
  );
}
