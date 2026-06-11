// Build a wa.me click-to-chat URL.
// Normalises phone to E.164 digits (no leading +, no spaces/dashes).
export function waLink(phone: string | null | undefined, message?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 7) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function openWhatsApp(phone: string | null | undefined, message?: string): boolean {
  const url = waLink(phone, message);
  if (!url) return false;
  window.open(url, "_blank", "noopener");
  return true;
}