// Read at call time, not at module load — avoids stale values in serverless/cold-start environments.
function getAsaasConfig() {
  return {
    apiKey: process.env.ASAAS_API_KEY ?? "",
    baseUrl:
      process.env.ASAAS_ENVIRONMENT === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3",
  };
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class AsaasError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "AsaasError";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  billingType: string;
  invoiceUrl?: string;
  failReasonCode?: string;
  deniedReason?: string;
  errors?: Array<{ code: string; description: string }>;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

// ─── Internal request helper ──────────────────────────────────────────────────

async function asaasReq<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { apiKey, baseUrl } = getAsaasConfig();

  if (!apiKey) {
    throw new AsaasError(
      "Chave da API de pagamento não configurada no servidor. Contate o suporte.",
      "missing_api_key",
      500,
    );
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
        ...(options.headers ?? {}),
      },
    });
  } catch (networkErr) {
    const msg =
      networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new AsaasError(
      `Não foi possível conectar ao gateway de pagamento: ${msg}`,
      "network_error",
      503,
    );
  }

  let data: T & { errors?: Array<{ code: string; description: string }> };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new AsaasError(
      `Resposta inválida do gateway de pagamento (HTTP ${res.status}).`,
      "invalid_response",
      502,
    );
  }

  if (!res.ok) {
    const firstErr = data.errors?.[0];
    const code = firstErr?.code ?? "unknown";
    const description = firstErr?.description ?? `Asaas API error ${res.status}`;
    throw new AsaasError(description, code, res.status);
  }

  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function isPaymentApproved(status: string): boolean {
  return ["CONFIRMED", "RECEIVED", "AUTHORIZED"].includes(status);
}

// ─── Error mapping ────────────────────────────────────────────────────────────

const CODE_MESSAGES: Record<string, string> = {
  // Erro de configuração da conta Asaas (ex.: domínio do callback não cadastrado)
  // — não é culpa do cartão do comprador.
  invalid_object: "Pagamento com cartão indisponível no momento. Use PIX.",
  invalid_creditcard: "Cartão inválido. Verifique os dados e tente novamente.",
  invalid_creditcard_number: "Número de cartão inválido.",
  invalid_creditcard_holder: "Nome do titular inválido.",
  invalid_creditcard_expiry_date: "Data de validade inválida.",
  invalid_creditcard_ccv: "CVV inválido.",
  expired_creditcard: "Cartão expirado.",
  insufficient_funds: "Cartão sem limite disponível.",
  card_declined: "Cartão recusado pela operadora.",
  blocked_card: "Cartão bloqueado.",
  do_not_honor: "Pagamento não autorizado pelo banco.",
};

export function mapAsaasCode(code: string): string {
  return (
    CODE_MESSAGES[code.toLowerCase().replace(/-/g, "_")] ??
    "Pagamento recusado. Tente outro cartão ou use o PIX."
  );
}

// ─── Customers ────────────────────────────────────────────────────────────────

/** Finds an existing customer by CPF/CNPJ or creates a new one. */
export async function findOrCreateCustomer(data: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}): Promise<AsaasCustomer> {
  const cpfCnpj = digitsOnly(data.cpfCnpj);

  const search = await asaasReq<{ data: AsaasCustomer[]; totalCount: number }>(
    `/customers?cpfCnpj=${cpfCnpj}`
  );
  if (search.data.length > 0) return search.data[0];

  return asaasReq<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      cpfCnpj,
      notificationDisabled: true,
      ...(data.phone ? { mobilePhone: digitsOnly(data.phone) } : {}),
    }),
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Creates a CREDIT_CARD charge WITHOUT card data, so Asaas returns an
 * `invoiceUrl` pointing to its own hosted payment page (PCI-minimal).
 * The buyer fills in card number / installments on the Asaas screen; the
 * card data never touches our server. Access is granted later by the webhook
 * once the payment is confirmed.
 */
export async function createHostedCardPayment(data: {
  customerId: string;
  value: number;
  description?: string;
  externalReference: string;
  successUrl: string;
  remoteIp?: string;
}): Promise<AsaasPayment> {
  // No `creditCard` / `creditCardHolderInfo` here on purpose — sending them
  // would make Asaas process the card server-side instead of returning invoiceUrl.
  return asaasReq<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "CREDIT_CARD",
      value: data.value,
      dueDate: todayISO(),
      description: data.description ?? "Compra",
      externalReference: data.externalReference,
      callback: {
        successUrl: data.successUrl,
        autoRedirect: true,
      },
      ...(data.remoteIp ? { remoteIp: data.remoteIp } : {}),
    }),
  });
}

/** Creates a PIX payment. Use getPixQrCode to retrieve the QR code. */
export async function createPixPayment(data: {
  customerId: string;
  value: number;
  dueDate?: string;
  description?: string;
}): Promise<AsaasPayment> {
  return asaasReq<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "PIX",
      value: data.value,
      dueDate: data.dueDate ?? todayISO(),
      ...(data.description ? { description: data.description } : {}),
    }),
  });
}

/** Retrieves the PIX QR code (base64 image + payload string) for a payment. */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasReq<AsaasPixQrCode>(
    `/payments/${encodeURIComponent(paymentId)}/pixQrCode`
  );
}

/** Retrieves the current status of a payment. */
export async function getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
  return asaasReq<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: string;
  cycle: string;
  value: number;
  nextDueDate: string;
  status: string;
}

/** Creates a monthly CREDIT_CARD subscription. */
export async function createCardSubscription(data: {
  customerId: string;
  value: number;
  nextDueDate: string;
  description?: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  holderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone?: string;
    postalCode?: string;
    addressNumber?: string;
  };
  remoteIp?: string;
}): Promise<AsaasSubscription> {
  return asaasReq<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "CREDIT_CARD",
      cycle: "MONTHLY",
      value: data.value,
      nextDueDate: data.nextDueDate,
      description: data.description ?? "Assinatura Mapping Partners",
      ...(data.remoteIp ? { remoteIp: data.remoteIp } : {}),
      creditCard: {
        holderName: data.creditCard.holderName,
        number: digitsOnly(data.creditCard.number),
        expiryMonth: data.creditCard.expiryMonth,
        expiryYear: data.creditCard.expiryYear,
        ccv: data.creditCard.ccv,
      },
      creditCardHolderInfo: {
        name: data.holderInfo.name,
        email: data.holderInfo.email,
        cpfCnpj: digitsOnly(data.holderInfo.cpfCnpj),
        ...(data.holderInfo.mobilePhone ? { mobilePhone: digitsOnly(data.holderInfo.mobilePhone) } : {}),
        ...(data.holderInfo.postalCode ? { postalCode: digitsOnly(data.holderInfo.postalCode) } : {}),
        ...(data.holderInfo.addressNumber ? { addressNumber: data.holderInfo.addressNumber } : {}),
      },
    }),
  });
}

/** Creates a monthly PIX subscription. */
export async function createPixSubscription(data: {
  customerId: string;
  value: number;
  nextDueDate: string;
  description?: string;
}): Promise<AsaasSubscription> {
  return asaasReq<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "PIX",
      cycle: "MONTHLY",
      value: data.value,
      nextDueDate: data.nextDueDate,
      description: data.description ?? "Assinatura Mapping Partners",
    }),
  });
}

/** Returns the list of payments for a subscription. */
export async function getSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
  return asaasReq<{ data: AsaasPayment[] }>(
    `/payments?subscription=${encodeURIComponent(subscriptionId)}`
  );
}

/** Cancels (deletes) a subscription. */
export async function cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean }> {
  return asaasReq<{ deleted: boolean }>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "DELETE" }
  );
}
