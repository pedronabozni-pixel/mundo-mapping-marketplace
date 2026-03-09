import type { Metadata } from "next";
import { getSiteContent } from "@/lib/store-data";

export const metadata: Metadata = {
  title: "Contato"
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const siteContent = await getSiteContent();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-serif text-4xl">{siteContent.contact.title}</h1>
      <p className="text-zinc-300">{siteContent.contact.subtitle}</p>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <p className="text-zinc-200">
          E-mail: <span className="text-amber-300">{siteContent.contact.email}</span>
        </p>
        <p className="mt-2 text-zinc-200">
          WhatsApp: <span className="text-amber-300">{siteContent.contact.whatsapp}</span>
        </p>
        <p className="mt-2 text-sm text-zinc-400">{siteContent.contact.hours}</p>
      </div>
    </div>
  );
}
