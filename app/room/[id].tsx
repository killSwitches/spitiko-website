import { useLocalSearchParams, useRouter } from "expo-router";
import { signInAnonymously } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import {
    ArrowLeft,
    ArrowRight,
    Bed,
    CheckCircle,
    Clock,
    Sparkle,
    Users,
    WarningCircle,
} from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { DateTimeField } from "@/components/date-time-field";
import { SiteHeader } from "@/components/site/site-header";
import {
    buildWhatsAppUrl,
    calcHourlyPrice,
    calcNightlyPrice,
    CreateBookingRequestSchema,
    formatCents,
    formatWhatsAppBookingMessage,
    generateBookingReference,
    getActiveDiscountPct,
    type BookingType,
    type PriceBreakdown,
    type Room,
    type WhatsAppConfig,
} from "@/lib/domain";
import { auth, db } from "@/lib/firebase";

/* ── Design Tokens & Constants ───────────────────────────── */
const COLORS = {
  bg: "#F7F3EE",
  bgTint: "#EDE8E0",
  surface: "#FFFFFF",
  ink: "#1C1916",
  inkSecondary: "#4A4540",
  muted: "#8C8078",
  brand: "#A9834B",
  brandDark: "#8A6835",
  brandSoft: "#EDE8E0",
  brandBorder: "#D8CEC0",
  line: "#DED6CC",
  error: "#B54A3A",
  errorBg: "#F8E8E4",
  success: "#3E6B43",
  successBg: "#E8F0E6",
} as const;

const FALLBACK_WHATSAPP = "27764751683";

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const MAX_STAY_MS = 31 * ONE_DAY_MS;

function bookingErrorMessage(cause: unknown) {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === "auth/admin-restricted-operation"
  ) {
    return "Online booking is not enabled yet. The lodge administrator must enable Anonymous sign-in in Firebase Console under Authentication → Sign-in method. No booking was submitted.";
  }

  return cause instanceof Error
    ? cause.message
    : "We could not send your booking request. Please try again.";
}

function isAnonymousSignInUnavailable(cause: unknown) {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === "auth/admin-restricted-operation"
  );
}

interface ReservationBlock {
  checkIn: Timestamp;
  checkOut: Timestamp;
}

/* ── Date & Pricing Helpers ──────────────────────────────── */
function localDateTime(date: Date) {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function requestedBookingWindow(checkInParam: unknown, checkOutParam: unknown) {
  const requestedStart =
    typeof checkInParam === "string" ? new Date(checkInParam) : null;
  const requestedEnd =
    typeof checkOutParam === "string" ? new Date(checkOutParam) : null;

  if (
    requestedStart &&
    requestedEnd &&
    Number.isFinite(requestedStart.getTime()) &&
    Number.isFinite(requestedEnd.getTime()) &&
    requestedStart > new Date() &&
    requestedEnd > requestedStart
  ) {
    return {
      checkIn: localDateTime(requestedStart),
      checkOut: localDateTime(requestedEnd),
    };
  }
  return null;
}

function defaultBookingWindow(type: BookingType) {
  const start = new Date(Date.now() + ONE_HOUR_MS);
  const durationMs = type === "hourly" ? ONE_HOUR_MS : ONE_DAY_MS;
  const end = new Date(start.getTime() + durationMs);
  return { checkIn: localDateTime(start), checkOut: localDateTime(end) };
}

function initialBookingWindow(
  checkInParam: unknown,
  checkOutParam: unknown,
  typeParam: unknown,
) {
  return (
    requestedBookingWindow(checkInParam, checkOutParam) ??
    defaultBookingWindow(typeParam === "hourly" ? "hourly" : "nightly")
  );
}

function calculateRoomPrice(
  room: Room,
  type: BookingType,
  start: Date,
  end: Date,
): PriceBreakdown | null {
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start
  ) {
    return null;
  }

  const discountPct = getActiveDiscountPct(room.promotion, type);

  if (type === "hourly" && room.hourlyRateCents) {
    return calcHourlyPrice({
      ratePerHourCents: room.hourlyRateCents,
      checkIn: start,
      checkOut: end,
      minHourlyMinutes: room.minHourlyMinutes,
      hourlyRoundingMinutes: room.hourlyRoundingMinutes,
      discountPct,
    });
  }

  if (type === "nightly" && room.nightlyRateCents) {
    return calcNightlyPrice({
      ratePerNightCents: room.nightlyRateCents,
      checkIn: start,
      checkOut: end,
      discountPct,
    });
  }

  return null;
}

function hasReservationOverlap(
  reservations: ReservationBlock[],
  start: Date,
  end: Date,
) {
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start
  ) {
    return false;
  }
  return reservations.some(
    (block) =>
      block.checkOut?.toDate &&
      block.checkIn?.toDate &&
      block.checkOut.toDate() > start &&
      block.checkIn.toDate() < end,
  );
}

/* ── Main Screen ─────────────────────────────────────────── */
export default function RoomDetailsScreen() {
  const {
    id,
    checkIn: checkInParam,
    checkOut: checkOutParam,
    type: typeParam,
    guests: guestsParam,
  } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    type?: string;
    guests?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 920;

  const [initialWindow] = useState(() =>
    initialBookingWindow(checkInParam, checkOutParam, typeParam),
  );
  const [hasCustomDateWindow, setHasCustomDateWindow] = useState(
    () => requestedBookingWindow(checkInParam, checkOutParam) !== null,
  );
  const [bookingDateLimits] = useState(() => ({
    minimum: localDateTime(new Date()),
    maximum: localDateTime(new Date(Date.now() + MAX_STAY_MS)),
  }));

  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<ReservationBlock[]>([]);
  const [whatsapp, setWhatsapp] = useState(FALLBACK_WHATSAPP);
  const [loadedRoomId, setLoadedRoomId] = useState<string | null>(null);
  const loading = loadedRoomId !== id;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [error, setError] = useState("");
  const [bookingType, setBookingType] = useState<BookingType>("nightly");
  const [checkIn, setCheckIn] = useState(initialWindow.checkIn);
  const [checkOut, setCheckOut] = useState(initialWindow.checkOut);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState<{
    bookingId: string | null;
    savedToFirestore: boolean;
    reference: string;
    durationLabel: string;
    basePriceCents: number;
    discountCents: number;
    totalCents: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    Promise.all([
      getDoc(doc(db, "rooms", id)),
      getDoc(doc(db, "config", "whatsapp")),
      getDoc(doc(db, "availability", id)),
    ])
      .then(([roomSnapshot, contactSnapshot, availabilitySnapshot]) => {
        if (cancelled) return;

        if (!roomSnapshot.exists()) {
          setError("This room is no longer available.");
        } else {
          const value = {
            id: roomSnapshot.id,
            ...roomSnapshot.data(),
          } as Room;

          if (!value.published || value.archived) {
            setError("This room is no longer available.");
          } else {
            setRoom(value);
            setActivePhotoIndex(0);
            const requestedGuests = Number(guestsParam);
            setGuestCount(
              Number.isInteger(requestedGuests) && requestedGuests > 0
                ? Math.min(requestedGuests, value.capacity || 1)
                : 1,
            );
            setError("");

            const requestedType =
              typeParam === "hourly" || typeParam === "nightly"
                ? typeParam
                : null;
            const canUseRequestedType =
              requestedType !== null &&
              (requestedType === "hourly"
                ? value.pricingMode === "hourly" || value.pricingMode === "both"
                : value.pricingMode === "nightly" ||
                  value.pricingMode === "both");

            const nextBookingType: BookingType =
              requestedType && canUseRequestedType
                ? requestedType
                : value.pricingMode === "hourly"
                  ? "hourly"
                  : "nightly";

            setBookingType(nextBookingType);

            if (!requestedBookingWindow(checkInParam, checkOutParam)) {
              const defaultWindow = defaultBookingWindow(nextBookingType);
              setCheckIn(defaultWindow.checkIn);
              setCheckOut(defaultWindow.checkOut);
            }
          }
        }

        if (contactSnapshot.exists()) {
          const configuredNumber = (contactSnapshot.data() as WhatsAppConfig)
            .number;
          if (configuredNumber) setWhatsapp(configuredNumber);
        }

        if (availabilitySnapshot.exists()) {
          setReservations(availabilitySnapshot.data().reservations ?? []);
        } else {
          setReservations([]);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load this room.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedRoomId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id, typeParam, checkInParam, checkOutParam]);

  const startDate = useMemo(() => new Date(checkIn), [checkIn]);
  const endDate = useMemo(() => new Date(checkOut), [checkOut]);

  const price = useMemo<PriceBreakdown | null>(() => {
    return room
      ? calculateRoomPrice(room, bookingType, startDate, endDate)
      : null;
  }, [room, bookingType, startDate, endDate]);

  const activeDiscountPct = useMemo(() => {
    return room ? getActiveDiscountPct(room.promotion, bookingType) : 0;
  }, [room, bookingType]);

  const hasDateConflict = useMemo(() => {
    return hasReservationOverlap(reservations, startDate, endDate);
  }, [reservations, startDate, endDate]);

  const selectBookingType = (type: BookingType) => {
    setBookingType(type);
    setError("");
    if (hasCustomDateWindow) return;

    const start = new Date(checkIn);
    if (!Number.isFinite(start.getTime())) return;
    const durationMs = type === "hourly" ? ONE_HOUR_MS : ONE_DAY_MS;
    setCheckOut(localDateTime(new Date(start.getTime() + durationMs)));
  };

  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    setHasCustomDateWindow(true);
    setError("");

    const nextStart = new Date(value);
    const currentEnd = new Date(checkOut);
    if (
      Number.isFinite(nextStart.getTime()) &&
      (!Number.isFinite(currentEnd.getTime()) || currentEnd <= nextStart)
    ) {
      const durationMs = bookingType === "hourly" ? ONE_HOUR_MS : ONE_DAY_MS;
      setCheckOut(localDateTime(new Date(nextStart.getTime() + durationMs)));
    }
  };

  const submitRequest = async () => {
    if (!room || !price) {
      setError(
        "Choose valid check-in and check-out times before requesting a booking.",
      );
      return;
    }
    if (room.status !== "active") {
      setError("This room is currently unavailable for booking.");
      return;
    }
    if (hasDateConflict) {
      setError(
        "This room is already booked during your selected dates. Please pick another window.",
      );
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const validation = CreateBookingRequestSchema.safeParse({
      roomId: room.id,
      type: bookingType,
      checkIn: start.toISOString(),
      checkOut: end.toISOString(),
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim(),
      guestsCount: guestCount,
      specialRequests: specialRequests.trim(),
    });

    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ||
          "Please check your booking details.",
      );
      return;
    }

    if (validation.data.guestsCount > room.capacity) {
      setError(`This room accommodates up to ${room.capacity} guests.`);
      return;
    }

    if (start < new Date() || end.getTime() - start.getTime() > MAX_STAY_MS) {
      setError("Choose a future stay that is no longer than 31 days.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const [roomSnapshot, occupiedSnapshot] = await Promise.all([
        getDoc(doc(db, "rooms", room.id)),
        getDoc(doc(db, "availability", room.id)),
      ]);

      if (!roomSnapshot.exists()) {
        throw new Error("This room is no longer available.");
      }

      const currentRoom = roomSnapshot.data() as Room;
      if (
        !currentRoom.published ||
        currentRoom.archived ||
        currentRoom.status !== "active"
      ) {
        throw new Error("This room is no longer accepting booking requests.");
      }

      if (
        (bookingType === "hourly" && currentRoom.pricingMode === "nightly") ||
        (bookingType === "nightly" && currentRoom.pricingMode === "hourly")
      ) {
        throw new Error(
          "This room no longer accepts the selected booking type. Please refresh and try again.",
        );
      }

      const currentPrice = calculateRoomPrice(
        currentRoom,
        bookingType,
        start,
        end,
      );
      if (!currentPrice) {
        throw new Error(
          "Pricing for this booking type is no longer available. Please refresh and try again.",
        );
      }

      const latestReservations: ReservationBlock[] = occupiedSnapshot.exists()
        ? (occupiedSnapshot.data().reservations ?? [])
        : [];
      setReservations(latestReservations);

      if (hasReservationOverlap(latestReservations, start, end)) {
        throw new Error(
          "This room is not available for the selected dates. Please choose another time.",
        );
      }

      const reference = generateBookingReference();
      let user = auth.currentUser;

      if (!user) {
        try {
          user = (await signInAnonymously(auth)).user;
        } catch (cause) {
          if (!isAnonymousSignInUnavailable(cause)) throw cause;

          setResult({
            bookingId: null,
            savedToFirestore: false,
            reference,
            durationLabel: currentPrice.durationLabel,
            basePriceCents: currentPrice.basePriceCents,
            discountCents: currentPrice.discountCents,
            totalCents: currentPrice.totalCents,
          });
          return;
        }
      }

      const bookingDoc = await addDoc(collection(db, "bookings"), {
        reference,
        roomId: room.id,
        roomSnapshot: {
          id: room.id,
          name: currentRoom.name,
          pricingMode: currentRoom.pricingMode,
          ...(currentRoom.hourlyRateCents !== undefined
            ? { hourlyRateCents: currentRoom.hourlyRateCents }
            : {}),
          ...(currentRoom.nightlyRateCents !== undefined
            ? { nightlyRateCents: currentRoom.nightlyRateCents }
            : {}),
        },
        guestUid: user.uid,
        guestName: validation.data.guestName,
        guestPhone: validation.data.guestPhone,
        ...(validation.data.guestEmail
          ? { guestEmail: validation.data.guestEmail }
          : {}),
        guestsCount: validation.data.guestsCount,
        type: validation.data.type,
        checkIn: Timestamp.fromDate(start),
        checkOut: Timestamp.fromDate(end),
        durationLabel: currentPrice.durationLabel,
        basePriceCents: currentPrice.basePriceCents,
        discountCents: currentPrice.discountCents,
        totalCents: currentPrice.totalCents,
        status: "PENDING",
        ...(validation.data.specialRequests
          ? { specialRequests: validation.data.specialRequests }
          : {}),
        whatsappOpened: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setResult({
        bookingId: bookingDoc.id,
        savedToFirestore: true,
        reference,
        durationLabel: currentPrice.durationLabel,
        basePriceCents: currentPrice.basePriceCents,
        discountCents: currentPrice.discountCents,
        totalCents: currentPrice.totalCents,
      });
    } catch (cause) {
      setError(bookingErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  const sendWhatsAppRequest = async () => {
    if (!result || !room || !whatsapp) {
      setError(
        result?.savedToFirestore
          ? "WhatsApp contact is not configured. Your booking request is saved as pending."
          : "WhatsApp contact is not configured, so your booking request could not be sent.",
      );
      return;
    }

    const message = formatWhatsAppBookingMessage({
      reference: result.reference,
      guestName: guestName.trim(),
      roomName: room.name,
      type: bookingType,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      durationLabel: result.durationLabel,
      totalLabel: formatCents(result.totalCents),
    });

    try {
      await Linking.openURL(buildWhatsAppUrl(whatsapp, message));
      if (result.bookingId) {
        void updateDoc(doc(db, "bookings", result.bookingId), {
          whatsappOpened: true,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : result.savedToFirestore
            ? "Unable to open WhatsApp. Your booking request remains pending."
            : "Unable to open WhatsApp. Your booking request has not been sent.",
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text style={styles.loadingText}>Loading room details...</Text>
      </View>
    );
  }

  if (error && !room) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorCard}>
          <WarningCircle color={COLORS.error} size={32} />
          <Text style={styles.errorCardText}>{error}</Text>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={({ pressed }) => [
              styles.primaryPillButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft color="#FFFFFF" size={16} />
            <Text style={styles.primaryPillText}>Back to rooms</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!room) return null;

  const photos = Array.isArray(room.photos) ? room.photos : [];
  const activePhotoUri = photos[activePhotoIndex] ?? photos[0];
  const maxGuests = Math.max(1, room.capacity || 2);

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SiteHeader />

      <ScrollView
        style={styles.page}
        contentContainerStyle={[
          styles.pageContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.layout,
            isCompact ? styles.layoutCompact : styles.layoutWide,
          ]}
        >
          {/* Left Column: Room Photos & Details */}
          <View style={[styles.roomColumn, isCompact && styles.roomColumnCompact]}>
            {activePhotoUri ? (
              <View style={styles.mainPhotoContainer}>
                <Image
                  source={{ uri: activePhotoUri }}
                  style={[styles.mainPhoto, isCompact && styles.mainPhotoCompact]}
                  accessibilityLabel={room.name}
                />

                {activeDiscountPct > 0 && (
                  <View style={styles.promoBadge}>
                    <Sparkle color="#FFFFFF" size={14} weight="fill" />
                    <Text style={styles.promoBadgeText}>
                      {activeDiscountPct}% OFF{" "}
                      {bookingType === "hourly" ? "HOURLY" : "OVERNIGHT"}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Interactive Thumbnail Strip */}
            {photos.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailStrip}
              >
                {photos.map((photo, index) => {
                  const isSelected = index === activePhotoIndex;
                  return (
                    <Pressable
                      key={`${photo}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`View photo ${index + 1}`}
                      onPress={() => setActivePhotoIndex(index)}
                      style={[
                        styles.thumbnailWrap,
                        isSelected && styles.thumbnailSelected,
                      ]}
                    >
                      <Image
                        source={{ uri: photo }}
                        style={styles.thumbnailPhoto}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.roomHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>YOUR SPACE AT ORA LODGE</Text>
                <Text style={styles.title}>{room.name}</Text>
              </View>
              <View style={styles.capacityBadge}>
                <Users color={COLORS.inkSecondary} size={16} />
                <Text style={styles.capacityText}>
                  Up to {room.capacity} guest{room.capacity === 1 ? "" : "s"}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{room.description}</Text>

            <View style={styles.priceRow}>
              {room.hourlyRateCents != null && (
                <View style={styles.rateCard}>
                  <Text style={styles.rateLabel}>HOURLY RATE</Text>
                  <Text style={styles.price}>
                    {formatCents(room.hourlyRateCents)}{" "}
                    <Text style={styles.priceUnit}>/ hour</Text>
                  </Text>
                </View>
              )}
              {room.nightlyRateCents != null && (
                <View style={styles.rateCard}>
                  <Text style={styles.rateLabel}>OVERNIGHT RATE</Text>
                  <Text style={styles.price}>
                    {formatCents(room.nightlyRateCents)}{" "}
                    <Text style={styles.priceUnit}>/ night</Text>
                  </Text>
                </View>
              )}
            </View>

            {room.amenities?.length ? (
              <View style={styles.amenities}>
                <Text style={styles.sectionTitle}>Thoughtful comforts</Text>
                <View style={styles.amenityList}>
                  {room.amenities.map((amenity) => (
                    <View key={amenity} style={styles.amenityPill}>
                      <CheckCircle
                        color={COLORS.brand}
                        size={15}
                        weight="bold"
                      />
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Right Column: Booking Form / Confirmation Card */}
          <View style={[styles.bookingCard, isCompact && styles.bookingCardCompact]}>
            {result ? (
              <View style={styles.confirmationWrap}>
                <View style={styles.successIconBadge}>
                  <CheckCircle color={COLORS.success} size={28} weight="fill" />
                </View>
                <Text style={styles.eyebrow}>
                  {result.savedToFirestore ? "REQUEST RECEIVED" : "REQUEST READY"}
                </Text>
                <Text style={styles.formTitle}>
                  Thank you, {guestName.trim().split(" ")[0] || "Guest"}.
                </Text>
                <Text style={styles.confirmationText}>
                  {result.savedToFirestore
                    ? "Your request is saved as pending. Sending a WhatsApp message does not automatically confirm your booking — our hosts will contact you directly to confirm availability."
                    : "No account is needed. Tap below to send your booking request directly to our hosts on WhatsApp. The request has not been saved online yet and is not confirmed until our team replies."}
                </Text>

                <View style={styles.referenceBox}>
                  <Text style={styles.referenceLabel}>BOOKING REFERENCE</Text>
                  <Text selectable style={styles.reference}>
                    {result.reference}
                  </Text>
                </View>

                <PriceSummary price={result} />

                {error ? (
                  <View accessibilityRole="alert" style={styles.errorBanner}>
                    <WarningCircle color={COLORS.error} size={18} />
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={sendWhatsAppRequest}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.submitText}>
                    Review request in WhatsApp
                  </Text>
                  <ArrowRight color="#FFFFFF" size={18} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace("/")}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.secondaryText}>Back to ORA LODGE</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.eyebrow}>PLAN YOUR STAY</Text>
                <Text style={styles.formTitle}>Request this room</Text>
                <Text style={styles.formNote}>
                  Your booking is not confirmed until our team contacts you.
                </Text>

                <Text style={[styles.label, { marginTop: 12 }]}>
                  BOOKING TYPE
                </Text>
                <View style={styles.typeSelector}>
                  {(["hourly", "nightly"] as const).map((type) => {
                    const enabled =
                      room.pricingMode === "both" || room.pricingMode === type;
                    const isSelected = bookingType === type;
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: isSelected,
                          disabled: !enabled,
                        }}
                        disabled={!enabled}
                        onPress={() => selectBookingType(type)}
                        style={[
                          styles.typeButton,
                          isSelected && styles.typeSelected,
                          !enabled && styles.typeDisabled,
                        ]}
                      >
                        {type === "hourly" ? (
                          <Clock
                            color={isSelected ? "#FFFFFF" : COLORS.inkSecondary}
                            size={17}
                          />
                        ) : (
                          <Bed
                            color={isSelected ? "#FFFFFF" : COLORS.inkSecondary}
                            size={17}
                          />
                        )}
                        <Text
                          style={[
                            styles.typeText,
                            isSelected && styles.typeTextSelected,
                          ]}
                        >
                          {type === "hourly" ? "By the hour" : "Overnight"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <DateTimeField
                  label="CHECK-IN"
                  value={checkIn}
                  onChange={handleCheckInChange}
                  minimumValue={bookingDateLimits.minimum}
                  maximumValue={bookingDateLimits.maximum}
                />

                <DateTimeField
                  label="CHECK-OUT"
                  value={checkOut}
                  onChange={(value) => {
                    setCheckOut(value);
                    setHasCustomDateWindow(true);
                    setError("");
                  }}
                  minimumValue={checkIn}
                  maximumValue={bookingDateLimits.maximum}
                />

                {hasDateConflict && (
                  <View accessibilityRole="alert" style={styles.errorBanner}>
                    <WarningCircle color={COLORS.error} size={18} />
                    <Text style={styles.errorBannerText}>
                      This room has an existing reservation overlapping these
                      times. Please select different dates.
                    </Text>
                  </View>
                )}

                <FormField
                  label="YOUR FULL NAME *"
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholder="Full name"
                />

                <FormField
                  label="PHONE NUMBER *"
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                  placeholder="+27 ..."
                  keyboardType="phone-pad"
                />

                <FormField
                  label="EMAIL · OPTIONAL"
                  value={guestEmail}
                  onChangeText={setGuestEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                />

                {/* Stepper for Guest Count */}
                <View style={styles.field}>
                  <Text style={styles.label}>
                    NUMBER OF GUESTS (MAX {maxGuests})
                  </Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Decrease guests"
                      disabled={guestCount <= 1}
                      onPress={() =>
                        setGuestCount((count) => Math.max(1, count - 1))
                      }
                      style={[
                        styles.stepperButton,
                        guestCount <= 1 && styles.typeDisabled,
                      ]}
                    >
                      <Text style={styles.stepperButtonText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepperValue}>
                      {guestCount} {guestCount === 1 ? "guest" : "guests"}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Increase guests"
                      disabled={guestCount >= maxGuests}
                      onPress={() =>
                        setGuestCount((count) => Math.min(maxGuests, count + 1))
                      }
                      style={[
                        styles.stepperButton,
                        guestCount >= maxGuests && styles.typeDisabled,
                      ]}
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <FormField
                  label="SPECIAL REQUESTS · OPTIONAL"
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  placeholder="Anything we should know?"
                  multiline
                />

                {price ? (
                  <PriceSummary price={price} />
                ) : (
                  <Text style={styles.priceHint}>
                    Enter valid check-in and check-out dates to see your quote.
                  </Text>
                )}

                {error ? (
                  <View accessibilityRole="alert" style={styles.errorBanner}>
                    <WarningCircle color={COLORS.error} size={18} />
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={submitRequest}
                  disabled={
                    submitting || room.status !== "active" || hasDateConflict
                  }
                  style={({ pressed }) => [
                    styles.submitButton,
                    (submitting ||
                      room.status !== "active" ||
                      hasDateConflict) &&
                      styles.buttonDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.submitText}>
                    {submitting ? "Sending request…" : "Send booking request"}
                  </Text>
                  {!submitting && <ArrowRight color="#FFFFFF" size={18} />}
                </Pressable>

                {room.status !== "active" ? (
                  <Text style={styles.unavailable}>
                    This room is currently unavailable.
                  </Text>
                ) : null}

                <Text style={styles.privacyNote}>
                  Your details are used only to manage this booking request.
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Subcomponents ───────────────────────────────────────── */
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={
          keyboardType === "email-address"
            ? "none"
            : label.includes("NAME")
              ? "words"
              : "sentences"
        }
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

function PriceSummary({
  price,
}: {
  price: Pick<
    PriceBreakdown,
    "basePriceCents" | "discountCents" | "totalCents" | "durationLabel"
  >;
}) {
  return (
    <View style={styles.priceSummary}>
      <View style={styles.priceLine}>
        <Text style={styles.priceLineLabel}>Duration</Text>
        <Text style={styles.priceLineValue}>{price.durationLabel}</Text>
      </View>
      <View style={styles.priceLine}>
        <Text style={styles.priceLineLabel}>Room rate</Text>
        <Text style={styles.priceLineValue}>
          {formatCents(price.basePriceCents)}
        </Text>
      </View>
      {price.discountCents > 0 && (
        <View style={styles.priceLine}>
          <Text style={styles.discountLabel}>Promotion discount</Text>
          <Text style={styles.discountLabel}>
            −{formatCents(price.discountCents)}
          </Text>
        </View>
      )}
      <View style={[styles.priceLine, styles.totalLine]}>
        <Text style={styles.totalLabel}>Quoted total</Text>
        <Text style={styles.totalAmount}>{formatCents(price.totalCents)}</Text>
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  pageContent: {
    alignItems: "center",
  },
  safe: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.bg,
  },
  loading: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
    gap: 12,
  },
  loadingText: {
    color: COLORS.inkSecondary,
    fontSize: 14,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.line,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    maxWidth: 400,
    padding: 28,
    width: "100%",
  },
  errorCardText: {
    color: COLORS.ink,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  primaryPillButton: {
    alignItems: "center",
    backgroundColor: COLORS.ink,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  stickyHeader: {
    backgroundColor: "rgba(247, 243, 238, 0.96)",
    borderBottomColor: COLORS.line,
    borderBottomWidth: 1,
    width: "100%",
    alignItems: "center",
    zIndex: 10,
  },
  topBar: {
    width: "100%",
    maxWidth: 1200,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarCompact: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.bgTint,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  backText: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  headerTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  layout: {
    width: "100%",
    maxWidth: 1180,
  },
  layoutWide: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "flex-start",
  },
  layoutCompact: {
    flexDirection: "column",
    gap: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
    alignItems: "center",
  },
  roomColumn: {
    flexGrow: 1,
    flexBasis: 470,
    maxWidth: 700,
  },
  roomColumnCompact: {
    flexGrow: 0,
    flexBasis: "auto",
    width: "100%",
  },
  mainPhotoContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.bgTint,
  },
  mainPhoto: {
    width: "100%",
    height: 380,
    resizeMode: "cover",
  },
  mainPhotoCompact: {
    height: 250,
  },
  promoBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: COLORS.brand,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  promoBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
  },
  thumbnailStrip: {
    gap: 10,
    paddingTop: 12,
  },
  thumbnailWrap: {
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    opacity: 0.7,
  },
  thumbnailSelected: {
    borderColor: COLORS.brand,
    opacity: 1,
  },
  thumbnailPhoto: {
    width: 76,
    height: 58,
    resizeMode: "cover",
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  eyebrow: {
    color: COLORS.brandDark,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
  },
  title: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0,
  },
  capacityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.bgTint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    marginTop: 4,
  },
  capacityText: {
    color: COLORS.inkSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  description: {
    color: COLORS.inkSecondary,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  rateCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 150,
  },
  rateLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 4,
  },
  price: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: "700",
  },
  priceUnit: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  amenities: {
    marginTop: 22,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: "600",
  },
  amenityList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  amenityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.line,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  amenityText: {
    color: COLORS.inkSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  bookingCard: {
    flexGrow: 1,
    flexBasis: 360,
    maxWidth: 460,
    backgroundColor: COLORS.surface,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
  },
  bookingCardCompact: {
    flexGrow: 0,
    flexBasis: "auto",
    width: "100%",
    maxWidth: 700,
    padding: 16,
  },
  formTitle: {
    color: COLORS.ink,
    fontSize: 24,
    fontWeight: "600",
    marginTop: 6,
  },
  formNote: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  label: {
    color: COLORS.inkSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 7,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
  },
  typeSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  typeDisabled: {
    opacity: 0.38,
  },
  typeText: {
    color: COLORS.inkSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  typeTextSelected: {
    color: "#FFFFFF",
  },
  field: {
    marginBottom: 16,
  },
  input: {
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    color: COLORS.ink,
    fontSize: 15,
    backgroundColor: COLORS.bg,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "600",
  },
  stepperValue: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  priceSummary: {
    backgroundColor: COLORS.brandSoft,
    borderColor: COLORS.brandBorder,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    borderRadius: 16,
  },
  priceLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 5,
  },
  priceLineLabel: {
    color: COLORS.inkSecondary,
    fontSize: 13,
  },
  priceLineValue: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  discountLabel: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: "600",
  },
  totalLine: {
    borderTopWidth: 1,
    borderColor: COLORS.brandBorder,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  totalAmount: {
    color: COLORS.brandDark,
    fontSize: 18,
    fontWeight: "700",
  },
  priceHint: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.errorBg,
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  submitButton: {
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.ink,
    borderRadius: 999,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  privacyNote: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 14,
  },
  unavailable: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "500",
  },
  confirmationWrap: {
    gap: 4,
  },
  successIconBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
  },
  confirmationText: {
    color: COLORS.inkSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  referenceBox: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.line,
    borderWidth: 1,
    padding: 16,
    marginTop: 18,
    marginBottom: 8,
    borderRadius: 16,
    alignItems: "center",
  },
  referenceLabel: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 0,
    fontWeight: "700",
  },
  reference: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
    letterSpacing: 0,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: COLORS.line,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 13,
    marginTop: 10,
  },
  secondaryText: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  stickyHeaderCompact: {
    paddingBottom: 4,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
