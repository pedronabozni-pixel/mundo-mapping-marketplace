import Link from "next/link";
import { STORE_NAME } from "@/lib/store-config";

const links = [
  { href: "/loja", label: "Home" },
  { href: "/loja/favoritos", label: "Favoritos" },
  { href: "/loja/sobre", label: "Sobre" },
  { href: "/loja/contato", label: "Contato" },
  { href: "/admin-loja", label: "Admin" }
];

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link className="font-serif text-xl font-semibold tracking-wide text-amber-300" href="/loja">
          {STORE_NAME}
        </Link>
        <nav className="flex items-center gap-2 text-sm text-zinc-200 md:gap-5">
          {links.map((link) => (
            <Link className="rounded px-2 py-1 transition hover:bg-zinc-800" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
