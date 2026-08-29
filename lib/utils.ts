import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function makeCode(name: string) {
  const stem = name.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) || "LEAGUE";
  return `${stem}${Math.floor(10 + Math.random() * 89)}`;
}
