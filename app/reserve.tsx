import { Link } from "expo-router";
import { ArrowLeft, CalendarBlank, Users } from "phosphor-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { DateTimeField } from "@/components/date-time-field";
import { SiteLayout, siteStyles } from "@/components/site/site-layout";
import { siteColors } from "@/constants/site-theme";
import { useWhatsAppNumber } from "@/hooks/use-whatsapp-number";
import { buildWhatsAppUrl } from "@/lib/domain";

function defaultReservationTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(19, 0, 0, 0);
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ReserveScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [reservationTime, setReservationTime] = useState(defaultReservationTime);
  const [guestCount, setGuestCount] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const { number: whatsapp, error: configError } = useWhatsAppNumber();
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  const sendReservation = async () => {
    const startsAt = new Date(reservationTime);
    if (!name.trim() || phone.trim().replace(/\D/g, "").length < 7) {
      setFeedback("Add your name and a valid phone number to continue.");
      return;
    }
    if (!Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) {
      setFeedback("Choose a reservation time in the future.");
      return;
    }
    if (configError) {
      setFeedback("The restaurant’s WhatsApp contact is unavailable. Please try again later.");
      return;
    }

    const message = [
      "*Spitiko — Table reservation request*",
      "",
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      `Date and time: ${startsAt.toLocaleString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      `Guests: ${guestCount}`,
      ...(notes.trim() ? ["", `Notes: ${notes.trim()}`] : []),
      "",
      "Please confirm my table reservation. Thank you!",
    ].join("\n");

    setSending(true);
    setFeedback("");
    try {
      await Linking.openURL(buildWhatsAppUrl(whatsapp.replace(/\D/g, ""), message));
      setFeedback("WhatsApp is open with your reservation request ready to send.");
    } catch {
      setFeedback("WhatsApp could not be opened. Please try again or contact us directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SiteLayout>
      <View style={siteStyles.content}>
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" style={styles.backLink}>
            <ArrowLeft size={16} color={siteColors.olive} />
            <Text style={styles.backText}>Back to Spitiko</Text>
          </Pressable>
        </Link>
        <View style={[styles.layout, wide && styles.layoutWide]}>
          <View style={styles.intro}>
            <View style={styles.iconCircle}>
              <CalendarBlank size={23} color={siteColors.olive} weight="regular" />
            </View>
            <Text style={styles.kicker}>RESERVATIONS</Text>
            <Text style={styles.title}>Request a table</Text>
            <Text style={styles.copy}>
              Choose a date, time, and group size. We’ll send your request to our
              team on WhatsApp for confirmation.
            </Text>
            <Text style={styles.confirmNote}>
              Your table is booked once our team confirms.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Reservation details</Text>
            <View style={[styles.formRow, !wide && styles.formColumn]}>
              <View style={styles.field}>
                <Text style={styles.label}>Your name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholder="Name for the reservation"
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+27..."
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.field}>
              <DateTimeField
                label="Date and time"
                value={reservationTime}
                onChange={setReservationTime}
                minimumValue={new Date().toISOString().slice(0, 16)}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Number of guests</Text>
              <View style={styles.guestBox}>
                <Users size={18} color={siteColors.olive} />
                <Text style={styles.guestLabel}>
                  {guestCount} {guestCount === 1 ? "guest" : "guests"}
                </Text>
                <View style={styles.steps}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove one guest"
                    disabled={guestCount <= 1}
                    onPress={() => setGuestCount((current) => Math.max(1, current - 1))}
                    style={[styles.step, guestCount <= 1 && styles.stepDisabled]}
                  >
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add one guest"
                    disabled={guestCount >= 20}
                    onPress={() => setGuestCount((current) => Math.min(20, current + 1))}
                    style={[styles.step, guestCount >= 20 && styles.stepDisabled]}
                  >
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Anything we should know? (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="High chair, special occasion, dietary needs…"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.notes]}
              />
            </View>
            {configError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                WhatsApp contact is unavailable. Please try again later.
              </Text>
            ) : null}
            {feedback ? (
              <Text accessibilityRole="alert" style={styles.feedback}>{feedback}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={sending || !!configError}
              onPress={() => void sendReservation()}
              style={[styles.submit, (sending || !!configError) && styles.disabled]}
            >
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
              <Text style={styles.submitText}>
                {sending ? "Opening WhatsApp…" : "Request reservation on WhatsApp"}
              </Text>
            </Pressable>
            <Text style={styles.privacy}>
              This sends a request only; it does not reserve a table until we confirm.
            </Text>
          </View>
        </View>
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  backLink: { flexDirection: "row", alignItems: "center", gap: 7, minHeight: 40, alignSelf: "flex-start" },
  backText: { color: siteColors.oliveDark, fontSize: 13, fontWeight: "700" },
  layout: { gap: 25, marginTop: 16 },
  layoutWide: { flexDirection: "row", alignItems: "flex-start", gap: 44, marginTop: 26 },
  intro: { flex: 0.85, paddingVertical: 12 },
  iconCircle: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: siteColors.oliveSoft },
  kicker: { color: siteColors.olive, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginTop: 21 },
  title: { color: siteColors.ink, fontSize: 36, lineHeight: 42, fontFamily: "Georgia", marginTop: 8 },
  copy: { color: siteColors.body, fontSize: 15, lineHeight: 23, marginTop: 12 },
  confirmNote: { color: siteColors.olive, fontSize: 13, fontWeight: "600", marginTop: 22 },
  form: { flex: 1.15, borderWidth: 1, borderColor: siteColors.border, borderRadius: 8, backgroundColor: siteColors.surface, padding: 20 },
  formTitle: { color: siteColors.ink, fontSize: 19, fontWeight: "700", marginBottom: 9 },
  formRow: { flexDirection: "row", gap: 12 },
  formColumn: { flexDirection: "column" },
  field: { flex: 1, minWidth: 0, marginTop: 13 },
  label: { color: siteColors.body, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { minHeight: 46, borderWidth: 1, borderColor: siteColors.border, borderRadius: 5, backgroundColor: siteColors.input, color: siteColors.ink, fontSize: 14, paddingHorizontal: 11, paddingVertical: 10 },
  notes: { minHeight: 85 },
  guestBox: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: siteColors.border, borderRadius: 5, backgroundColor: siteColors.input, paddingHorizontal: 11 },
  guestLabel: { flex: 1, color: siteColors.ink, fontSize: 13, fontWeight: "600" },
  steps: { flexDirection: "row", gap: 7 },
  step: { width: 31, height: 31, alignItems: "center", justifyContent: "center", borderRadius: 5, backgroundColor: siteColors.oliveSoft },
  stepDisabled: { opacity: 0.4 },
  stepText: { color: siteColors.oliveDark, fontSize: 20, lineHeight: 24, fontWeight: "600" },
  submit: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 5, backgroundColor: siteColors.oliveDark, paddingHorizontal: 14, marginTop: 18 },
  submitText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.5 },
  error: { color: siteColors.danger, fontSize: 12, lineHeight: 18, marginTop: 13 },
  feedback: { color: siteColors.olive, fontSize: 12, lineHeight: 18, marginTop: 13 },
  privacy: { color: siteColors.muted, fontSize: 11, lineHeight: 17, marginTop: 10 },
});
