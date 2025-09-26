import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatTokenAmount(
  amount: number | string,
  decimals = 18,
  precision = 2,
): string {
  if (!amount) return "0";
  const value = Number(amount) / 10 ** decimals;
  return value.toLocaleString("en-US", { maximumFractionDigits: precision });
}

export function extractRevertReason(error: unknown): string {
  // Try to handle different error shapes
  if (typeof error === "object" && error !== null) {
    // If error is a thirdweb error object
    // @ts-expect-error - error object may have message property
    if (error.message) {
      // @ts-expect-error - message property exists but TypeScript doesn't know
      const match = error.message.match(/execution reverted: (.*?)(["}]|$)/);
      if (match && match[1]) {
        return match[1].trim();
      }
      // fallback: show the message
      // @ts-expect-error - message property exists but TypeScript doesn't know
      return error.message;
    }
  }
  // fallback: show stringified error
  return String(error);
}