import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isSameDay as isSameDayFns, isToday, isYesterday, getYear } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isSameDay(a: Date, b: Date): boolean {
  return isSameDayFns(a, b);
}

export function formatDateHeader(date: Date): string {
  const now = new Date();
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  const sameYear = getYear(date) === getYear(now);
  return sameYear ? format(date, "EEE, MMM d") : format(date, "EEE, MMM d, yyyy");
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
