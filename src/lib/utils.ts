import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('my-MM', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' Ks';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('my-MM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  pharmacy: 'ဆေးဆိုင်',
  bakery: 'မုန့်ဆိုင်',
  grocery: 'မိုးကုတ်ဆိုင်',
  restaurant: 'စားသောက်ဆိုင်',
  clothing: 'အဝတ်အထည်ဆိုင်',
  general: 'အထွေထွေကုန်ဆိုင်',
};

export const SHOW_EXPIRY_DATE_FOR = ['pharmacy', 'bakery', 'grocery', 'restaurant'];
export const SHOW_IMAGE_FOR = ['clothing', 'restaurant', 'bakery'];

export function showExpiryDate(businessType: string): boolean {
  return SHOW_EXPIRY_DATE_FOR.includes(businessType);
}

export function showImageUpload(businessType: string): boolean {
  return SHOW_IMAGE_FOR.includes(businessType);
}
