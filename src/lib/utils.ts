import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function capitalizeText(text: string) {
  if (!text) return text

  return text[0]!.toUpperCase() + text.substring(1)
}

export function randomUUID(maxLength = 12) {
  return crypto.randomUUID().replace(/-/gi, "").substring(0, maxLength).toUpperCase()
}