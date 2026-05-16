/**
 * Validates a Brazilian CPF number.
 * Strips non-digit characters before validation.
 */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11) return false;

  // Reject sequences where all digits are the same (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10], 10)) return false;

  return true;
}

/**
 * Formats a string as a CPF mask: 000.000.000-00
 * Strips non-digit characters and limits to 11 digits.
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formats a string as a phone mask.
 * - 11 digits (mobile): (00) 00000-0000
 * - 10 digits (landline): (00) 0000-0000
 * Strips non-digit characters and limits to 11 digits.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  if (digits.length <= 10) {
    // Landline pattern: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // Mobile pattern: (00) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
