import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHash(hash: string, head = 8, tail = 6) {
  if (hash.length <= head + tail) {
    return hash;
  }

  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
