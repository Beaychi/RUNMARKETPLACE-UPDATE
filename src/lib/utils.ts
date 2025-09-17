import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a WhatsApp phone number for use with wa.me links.
 * - Removes non-digits
 * - Converts leading 0 to Nigeria country code 234 (customize if needed)
 * - Prepends country code if number starts with +234 or 234
 */
export function normalizeWhatsAppNumber(rawNumber?: string): string | null {
  if (!rawNumber) return null;
  const digitsOnly = rawNumber.replace(/\D+/g, "");
  if (digitsOnly.length === 0) return null;

  // If already starts with 234, assume correct
  if (digitsOnly.startsWith("234")) return digitsOnly;

  // If provided as local Nigerian number starting with 0, convert to 234
  if (digitsOnly.startsWith("0")) return `234${digitsOnly.slice(1)}`;

  // If provided with leading country code like +234 removed by regex, handled above
  // For other cases, return as-is (user may already provide international format)
  return digitsOnly;
}
