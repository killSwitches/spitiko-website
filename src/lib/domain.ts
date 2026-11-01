import { z } from 'zod';

export type BookingType = 'hourly' | 'nightly';
export type RoomPricingMode = 'hourly' | 'nightly' | 'both';

export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

export interface Promotion {
  enabled: boolean;
  discountPct: number;
  appliesTo: BookingType | 'both';
  startsAt: Timestamp;
  endsAt: Timestamp;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  photos: string[];
  amenities: string[];
  capacity: number;
  pricingMode: RoomPricingMode;
  hourlyRateCents?: number;
  nightlyRateCents?: number;
  minHourlyMinutes?: number;
  hourlyRoundingMinutes?: number;
  published: boolean;
  archived: boolean;
  status: 'active' | 'maintenance' | 'blocked';
  promotion?: Promotion;
}

export interface WhatsAppConfig {
  number: string;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface MaintenanceConfig {
  enabled: boolean;
  title: string;
  message: string;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface PriceBreakdown {
  basePriceCents: number;
  discountCents: number;
  totalCents: number;
  durationLabel: string;
  units: number;
  unitLabel: string;
}

export const CreateBookingRequestSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  type: z.enum(['hourly', 'nightly']),
  checkIn: z.string().datetime({ message: 'Invalid check-in time' }),
  checkOut: z.string().datetime({ message: 'Invalid check-out time' }),
  guestName: z.string().trim().min(2, 'Full name is required').max(100),
  guestPhone: z.string().trim().min(7, 'Phone number is required').max(20)
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
  guestEmail: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  guestsCount: z.number().int().min(1, 'At least 1 guest').max(50),
  specialRequests: z.string().trim().max(500).optional(),
}).refine(
  (booking) => new Date(booking.checkOut) > new Date(booking.checkIn),
  { message: 'Check-out must be after check-in', path: ['checkOut'] },
);

function roundUpMinutes(minutes: number, roundingMinutes: number): number {
  return roundingMinutes <= 0 ? minutes : Math.ceil(minutes / roundingMinutes) * roundingMinutes;
}

function applyDiscount(baseCents: number, discountPct: number): number {
  return discountPct <= 0 || discountPct > 100 ? 0 : Math.round(baseCents * discountPct / 100);
}

export function calcHourlyPrice(params: {
  ratePerHourCents: number;
  checkIn: Date;
  checkOut: Date;
  minHourlyMinutes?: number;
  hourlyRoundingMinutes?: number;
  discountPct?: number;
}): PriceBreakdown {
  const {
    ratePerHourCents,
    checkIn,
    checkOut,
    minHourlyMinutes = 60,
    hourlyRoundingMinutes = 30,
    discountPct = 0,
  } = params;
  const rawMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
  const minutes = roundUpMinutes(Math.max(rawMinutes, minHourlyMinutes), hourlyRoundingMinutes);
  const hours = minutes / 60;
  const basePriceCents = Math.round(ratePerHourCents * hours);
  const discountCents = applyDiscount(basePriceCents, discountPct);
  const unitLabel = hours === 1 ? 'hour' : 'hours';
  return {
    basePriceCents,
    discountCents,
    totalCents: basePriceCents - discountCents,
    durationLabel: `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} ${unitLabel}`,
    units: hours,
    unitLabel,
  };
}

export function calcNightlyPrice(params: {
  ratePerNightCents: number;
  checkIn: Date;
  checkOut: Date;
  discountPct?: number;
}): PriceBreakdown {
  const { ratePerNightCents, checkIn, checkOut, discountPct = 0 } = params;
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = Date.UTC(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
  const end = Date.UTC(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
  const nights = Math.max(1, Math.round((end - start) / msPerDay));
  const basePriceCents = ratePerNightCents * nights;
  const discountCents = applyDiscount(basePriceCents, discountPct);
  const unitLabel = nights === 1 ? 'night' : 'nights';
  return {
    basePriceCents,
    discountCents,
    totalCents: basePriceCents - discountCents,
    durationLabel: `${nights} ${unitLabel}`,
    units: nights,
    unitLabel,
  };
}

export function getActiveDiscountPct(
  promotion: Promotion | undefined,
  bookingType: BookingType,
  atTime = new Date(),
): number {
  if (!promotion?.enabled || promotion.discountPct <= 0) return 0;
  const start = new Date(promotion.startsAt.seconds * 1000);
  const end = new Date(promotion.endsAt.seconds * 1000);
  if (atTime < start || atTime > end) return 0;
  if (promotion.appliesTo !== 'both' && promotion.appliesTo !== bookingType) return 0;
  return promotion.discountPct;
}

export function formatCents(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

export function formatRate(cents: number, per: 'hour' | 'night'): string {
  return `${formatCents(cents)}/${per}`;
}

export function generateBookingReference(date = new Date()): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ORA-${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}-${suffix}`;
}

export function formatWhatsAppBookingMessage(params: {
  reference: string;
  guestName: string;
  roomName: string;
  type: BookingType;
  checkIn: Date;
  checkOut: Date;
  durationLabel: string;
  totalLabel: string;
}): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const bookingType = params.type === 'hourly' ? 'Hourly Booking' : 'Nightly Booking';
  return [
    '*ORA LODGE — Booking Request*',
    '',
    `📋 Reference: *${params.reference}*`,
    `👤 Guest: ${params.guestName}`,
    `🏠 Room: ${params.roomName}`,
    `📅 Type: ${bookingType}`,
    '',
    `⏰ Check-in:  ${params.checkIn.toLocaleDateString('en-ZA', dateOptions)} at ${params.checkIn.toLocaleTimeString('en-ZA', timeOptions)}`,
    `⏰ Check-out: ${params.checkOut.toLocaleDateString('en-ZA', dateOptions)} at ${params.checkOut.toLocaleTimeString('en-ZA', timeOptions)}`,
    `⌛ Duration: ${params.durationLabel}`,
    '',
    `💰 Quoted Total: *${params.totalLabel}*`,
    '',
    '_Please confirm my booking request. Thank you!_',
  ].join('\n');
}

export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
