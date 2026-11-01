export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  offerPriceCents?: number;
  imageUrl: string;
  available: boolean;
  featured: boolean;
  offer: boolean;
}

export function formatMenuPrice(priceCents: number): string {
  return `R${(priceCents / 100).toFixed(2)}`;
}

export function getMenuPriceCents(item: MenuItem): number {
  const offerPrice = item.offerPriceCents;
  return item.offer &&
    typeof offerPrice === "number" &&
    Number.isInteger(offerPrice) &&
    offerPrice > 0 &&
    offerPrice < item.priceCents
    ? offerPrice
    : item.priceCents;
}
