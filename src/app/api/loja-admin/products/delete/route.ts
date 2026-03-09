import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_CONFIG, ADMIN_COOKIE_NAME } from "@/lib/store-config";
import { deleteProduct } from "@/lib/store-data";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (token !== ADMIN_CONFIG.sessionToken) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as { slug?: string };
  const slug = String(body.slug ?? "").trim();

  if (!slug) {
    return NextResponse.json({ message: "Slug do produto não informado." }, { status: 400 });
  }

  const deleted = await deleteProduct(slug);

  if (!deleted) {
    return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  }

  revalidatePath("/loja");
  revalidatePath("/loja/favoritos");
  revalidatePath(`/loja/produtos/${slug}`);

  return NextResponse.json({ ok: true });
}
