export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export interface MaintenanceConfig {
  enabled: boolean;
  title?: string;
  message?: string;
}
