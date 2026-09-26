import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely.
 * Re-exported for use everywhere components need dynamic class building.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
