import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_CONFIG, ADMIN_COOKIE_NAME } from "@/lib/store-config";
import { saveImageUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (token !== ADMIN_CONFIG.sessionToken) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const imageFile = formData.get("imageFile");

  if (!(imageFile instanceof File)) {
    return NextResponse.json({ message: "Arquivo de imagem não enviado." }, { status: 400 });
  }

  const imageUrl = await saveImageUpload(imageFile, "store");

  if (!imageUrl) {
    return NextResponse.json({ message: "Arquivo inválido. Use uma imagem válida." }, { status: 400 });
  }

  return NextResponse.json({ imageUrl });
}
