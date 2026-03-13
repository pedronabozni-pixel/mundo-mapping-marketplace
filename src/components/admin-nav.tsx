import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/admin", label: "Resumo" },
  { href: "/admin/conteudos", label: "Conteúdos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/planos", label: "Planos" },
  { href: "/admin/metricas", label: "Métricas" }
];

export function AdminNav() {
  return (
    <aside className="card h-fit space-y-4 border-brand/25">
      <div className="glass-line -mx-4 -mt-4 rounded-t-2xl px-4 pb-3 pt-3">
        <Image alt="Decentralized Club" className="h-14 w-auto" height={56} src="/brand/logo.svg?v=2" width={180} />
        <h2 className="brand-title text-xl">Área Admin</h2>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2">
        {links.map((link) => (
          <Link
            className="block min-w-max rounded-xl border border-transparent px-3 py-2 text-sm transition hover:border-brand/40 hover:bg-panelSoft md:min-w-0"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="md:block">
        <SignOutButton />
      </div>
    </aside>
  );
}
