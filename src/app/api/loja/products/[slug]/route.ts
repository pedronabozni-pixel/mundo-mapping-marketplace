import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/store-data";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
