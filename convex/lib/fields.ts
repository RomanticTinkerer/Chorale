const EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export const INBOX_EMAIL = "auraandtinkerer@gmail.com";

export function normalizeName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) {
    throw new Error("Enter your full name.");
  }
  if (trimmed.length > 120) {
    throw new Error("Name is too long.");
  }
  return trimmed;
}

export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL.test(trimmed) || trimmed.length > 254) {
    throw new Error("Enter an email like name@example.com.");
  }
  return trimmed;
}

export function normalizeCity(city: string | undefined): string | undefined {
  if (city === undefined) {
    return undefined;
  }
  const trimmed = city.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > 80) {
    throw new Error("City is too long.");
  }
  return trimmed;
}

export function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length < 2) {
    throw new Error("Write a short message.");
  }
  if (trimmed.length > 2000) {
    throw new Error("Message is too long.");
  }
  return trimmed;
}
