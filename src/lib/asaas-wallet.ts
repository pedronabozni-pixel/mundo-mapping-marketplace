function getAsaasConfig() {
  return {
    apiKey: process.env.ASAAS_API_KEY ?? "",
    baseUrl:
      process.env.ASAAS_ENVIRONMENT === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3",
  };
}

export interface CreateWalletInput {
  name: string;
  email: string;
  cpfCnpj?: string | null;
  mobilePhone?: string | null;
}

export interface AsaasWallet {
  id: string;
  name: string;
  email: string;
}

export async function createAsaasWallet(input: CreateWalletInput): Promise<AsaasWallet> {
  const { apiKey, baseUrl } = getAsaasConfig();

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada no servidor.");
  }

  const payload: Record<string, string> = {
    name: input.name,
    email: input.email,
  };
  if (input.cpfCnpj) payload.cpfCnpj = input.cpfCnpj.replace(/\D/g, "");
  if (input.mobilePhone) payload.mobilePhone = input.mobilePhone.replace(/\D/g, "");

  const res = await fetch(`${baseUrl}/wallets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    const description = json.errors?.[0]?.description ?? json.message ?? "Erro ao criar wallet Asaas";
    throw new Error(description);
  }

  return json as AsaasWallet;
}
