const BASE_URL =
  process.env.ASAAS_ENVIRONMENT === 'production'
    ? 'https://api.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

const API_KEY = process.env.ASAAS_API_KEY ?? '';

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
  errors?: Array<{ code: string; description: string }>;
}

// ─── Internal request helper ──────────────────────────────────────────────────

async function req<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: API_KEY,
      ...(options.headers ?? {}),
    },
  });

  const data = (await res.json()) as T;

  if (!res.ok) {
    const err = data as { errors?: Array<{ code: string; description: string }> };
    const message =
      err.errors?.map((e) => `${e.code}: ${e.description}`).join(', ') ??
      `Asaas API error ${res.status}`;
    throw new Error(message);
  }

  return data;
}

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Finds an existing Asaas customer by CPF/CNPJ or creates a new one.
 */
export async function findOrCreateCustomer(data: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}): Promise<AsaasCustomer> {
  const cpfCnpj = stripNonDigits(data.cpfCnpj);

  const searchResult = await req<{
    data: AsaasCustomer[];
    totalCount: number;
  }>(`/customers?cpfCnpj=${cpfCnpj}`);

  if (searchResult.data.length > 0) {
    return searchResult.data[0];
  }

  return req<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      cpfCnpj,
      ...(data.phone ? { phone: data.phone } : {}),
    }),
  });
}

/**
 * Creates a credit card payment.
 */
export async function createCardPayment(data: {
  customerId: string;
  value: number;
  installmentCount: number;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone: string;
    postalCode: string;
    addressNumber: string;
  };
  remoteIp: string;
}): Promise<AsaasPayment> {
  const dueDate = new Date().toISOString().split('T')[0];
  const { installmentCount, value } = data;

  const installmentValue =
    installmentCount > 1
      ? Math.ceil((value / installmentCount) * 100) / 100
      : undefined;

  const payload: Record<string, unknown> = {
    customer: data.customerId,
    billingType: 'CREDIT_CARD',
    value,
    dueDate,
    installmentCount,
    ...(installmentValue !== undefined ? { installmentValue } : {}),
    creditCard: {
      holderName: data.creditCard.holderName,
      number: stripNonDigits(data.creditCard.number),
      expiryMonth: data.creditCard.expiryMonth,
      expiryYear: data.creditCard.expiryYear,
      ccv: data.creditCard.ccv,
    },
    creditCardHolderInfo: {
      name: data.creditCardHolderInfo.name,
      email: data.creditCardHolderInfo.email,
      cpfCnpj: stripNonDigits(data.creditCardHolderInfo.cpfCnpj),
      mobilePhone: stripNonDigits(data.creditCardHolderInfo.mobilePhone),
      postalCode: stripNonDigits(data.creditCardHolderInfo.postalCode),
      addressNumber: data.creditCardHolderInfo.addressNumber,
    },
    remoteIp: data.remoteIp,
    capture: true,
  };

  return req<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Creates a PIX payment and returns the payment object (use getPixQrCode for the QR code).
 */
export async function createPixPayment(data: {
  customerId: string;
  value: number;
  dueDate: string;
  description?: string;
}): Promise<AsaasPayment> {
  return req<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: data.customerId,
      billingType: 'PIX',
      value: data.value,
      dueDate: data.dueDate,
      ...(data.description ? { description: data.description } : {}),
    }),
  });
}

/**
 * Retrieves the PIX QR code for an existing payment.
 */
export async function getPixQrCode(paymentId: string): Promise<{
  encodedImage: string;
  payload: string;
  expirationDate: string;
}> {
  return req(`/payments/${paymentId}/pixQrCode`);
}

/**
 * Retrieves the current status/details of a payment.
 */
export async function getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
  return req<AsaasPayment>(`/payments/${paymentId}`);
}
