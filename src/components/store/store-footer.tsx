import Link from "next/link";

export function StoreFooter() {
  return (
    <footer className="mt-14 border-t border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-zinc-300 md:flex-row md:items-center md:justify-between">
        <p>Genesis Distribuidora © {new Date().getFullYear()} - Tecnologia premium com entrega nacional.</p>
        <div className="flex gap-4">
          <Link className="hover:text-amber-300" href="/loja/sobre">
            Sobre
          </Link>
          <Link className="hover:text-amber-300" href="/loja/contato">
            Contato
          </Link>
        </div>
      </div>
    </footer>
  );
}
