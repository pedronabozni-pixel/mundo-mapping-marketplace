import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/store/favorite-button";
import { HotmartButton } from "@/components/store/hotmart-button";
import { ProductCard } from "@/components/store/product-card";
import { ProductViewTracker } from "@/components/store/product-view-tracker";
import { StarRating } from "@/components/store/star-rating";
import { getProductBySlug, getProducts } from "@/lib/store-data";
import { formatMoney } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Produto não encontrado" };
  }

  return {
    title: `${product.name} - Comprar Agora`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [product.image]
    }
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const products = await getProducts();
  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <div className="space-y-10">
      <ProductViewTracker productName={product.name} />
      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <img alt={product.name} className="h-[430px] w-full rounded-xl object-cover" src={product.image} />
          </div>
          {product.videoUrl ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
              <p className="mb-2 text-sm font-medium text-zinc-300">Vídeo do produto</p>
              <video className="w-full rounded-xl" controls preload="metadata" src={product.videoUrl} />
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="inline-flex rounded-full border border-amber-500/50 px-3 py-1 text-xs text-amber-300">Oferta de hoje</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{product.category}</p>
          <h1 className="font-serif text-4xl">{product.name}</h1>
          <StarRating rating={product.rating} reviewsCount={product.reviewsCount} />
          <p className="text-zinc-300">{product.description}</p>

          <ul className="space-y-2">
            {product.features.map((feature) => (
              <li className="text-sm text-zinc-300" key={feature}>
                • {feature}
              </li>
            ))}
          </ul>

          <p className="text-3xl font-bold text-amber-300">{formatMoney(product.priceCents)}</p>

          {product.stockHint ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{product.stockHint}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <HotmartButton
              className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-zinc-950 transition hover:scale-[1.02] hover:bg-amber-300"
              href={product.hotmartUrl}
              label="Compre agora"
              productName={product.name}
            />
            <FavoriteButton slug={product.slug} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Você também pode gostar</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
