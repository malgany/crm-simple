import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function formatPhone(phone: string) {
  const digits = normalizePhone(phone);

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 13) {
    return digits.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4");
  }

  return phone;
}

export function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function buildWhatsappUrl(phone: string) {
  const digits = normalizePhone(phone);

  if (!digits) {
    return null;
  }

  const whatsappNumber =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;

  return `https://wa.me/${whatsappNumber}`;
}

export function buildTelUrl(phone: string) {
  const digits = normalizePhone(phone);

  return digits ? `tel:${digits}` : null;
}

export function buildMailtoUrl(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  return `mailto:${email}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = error.message;

    if (typeof message === "string" && message) {
      return message;
    }
  }

  return fallback;
}
