import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_CONFIG, ADMIN_COOKIE_NAME } from "@/lib/store-config";
import { deleteProduct, updateProduct } from "@/lib/store-data";
import type { Product } from "@/types/store";

function unauthorized() {
  return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
}

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (token !== ADMIN_CONFIG.sessionToken) {
    return unauthorized();
  }

  const { slug } = await context.params;
  const payload = (await request.json()) as Product;
  const updated = await updateProduct(slug, payload);

  if (!updated) {
    return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  }

  // Atualiza cache das páginas da loja após edição no painel.
  revalidatePath("/loja");
  revalidatePath("/loja/favoritos");
  revalidatePath(`/loja/produtos/${slug}`);

  return NextResponse.json({ product: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (token !== ADMIN_CONFIG.sessionToken) {
    return unauthorized();
  }

  const { slug } = await context.params;
  const deleted = await deleteProduct(slug);

  if (!deleted) {
    return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  }

  revalidatePath("/loja");
  revalidatePath("/loja/favoritos");
  revalidatePath(`/loja/produtos/${slug}`);

  return NextResponse.json({ ok: true });
}
