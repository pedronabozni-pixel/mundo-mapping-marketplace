import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import type { Product } from "@/types/store";
import { HotmartButton } from "@/components/store/hotmart-button";
import { ScarcityCountdown } from "@/components/store/scarcity-countdown";
import { StarRating } from "@/components/store/star-rating";

export function HeroAnchor({ product }: { product: Product }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 md:p-10">
      <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="inline-flex rounded-full border border-amber-400/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
            Produto Mais Vendido
          </p>
          <h1 className="font-serif text-4xl leading-tight text-zinc-100 md:text-5xl">{product.name}</h1>
          <StarRating rating={product.rating} reviewsCount={product.reviewsCount} />
          <p className="max-w-xl text-zinc-300">{product.description}</p>
          {product.stockHint ? (
            <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200">
              {product.stockHint}
            </p>
          ) : null}
          <ScarcityCountdown />
          <div className="flex flex-wrap items-center gap-3">
            <HotmartButton
              className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-zinc-950 transition hover:scale-[1.02] hover:bg-amber-300"
              href={product.hotmartUrl}
              label={`Comprar Agora - ${formatMoney(product.priceCents)}`}
              productName={product.name}
            />
            <Link className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200" href={`/loja/produtos/${product.slug}`}>
              Ver detalhes
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <img alt={product.name} className="h-[380px] w-full rounded-xl object-cover" src={product.image} />
        </div>
      </div>
    </section>
  );
}
