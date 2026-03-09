import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_CONFIG, ADMIN_COOKIE_NAME } from "@/lib/store-config";
import { updateSiteContent } from "@/lib/store-data";
import type { SiteContent } from "@/types/store";

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (token !== ADMIN_CONFIG.sessionToken) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const payload = (await request.json()) as SiteContent;

  if (!payload?.about || !payload?.contact) {
    return NextResponse.json({ message: "Conteúdo inválido." }, { status: 400 });
  }

  const saved = await updateSiteContent(payload);

  revalidatePath("/loja/sobre");
  revalidatePath("/loja/contato");

  return NextResponse.json({ siteContent: saved });
}
