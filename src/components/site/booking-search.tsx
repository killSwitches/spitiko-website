import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { DateTimeField } from "@/components/date-time-field";

function formatDateTime(date: Date) {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);
  checkIn.setHours(15, 0, 0, 0);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);
  checkOut.setHours(10, 0, 0, 0);
  return { checkIn: formatDateTime(checkIn), checkOut: formatDateTime(checkOut) };
}

export function BookingSearch({ initialCheckIn, initialCheckOut, initialGuests }: { initialCheckIn?: string; initialCheckOut?: string; initialGuests?: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const [dates] = useState(() => defaultDates());
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? dates.checkIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? dates.checkOut);
  const [guests, setGuests] = useState(() => {
    const parsed = Number(initialGuests);
    return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 12) : 2;
  });

  const search = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return;
    router.push({ pathname: "/rooms", params: { checkIn, checkOut, guests: `${guests}` } });
  };

  return (
    <View style={styles.frame}>
      <View style={[styles.fields, isWide && styles.fieldsWide]}>
        <View style={[styles.destination, isWide && styles.destinationWide]}>
          <Text style={styles.label}>DESTINATION</Text><Text style={styles.destinationText}>Ga-Masemola, Limpopo</Text>
        </View>
        <View style={[styles.dateRow, isWide && styles.dateRowWide]}>
          <View style={styles.dateField}><DateTimeField label="Check-in" value={checkIn} onChange={setCheckIn} minimumValue={formatDateTime(new Date())} /></View>
          <View style={styles.dateField}><DateTimeField label="Check-out" value={checkOut} onChange={setCheckOut} minimumValue={checkIn} /></View>
        </View>
        <View style={[styles.guestField, isWide && styles.guestFieldWide]}>
          <Text style={styles.label}>GUESTS</Text>
          <View style={styles.guestControls}>
            <Pressable accessibilityRole="button" accessibilityLabel="Remove one guest" disabled={guests <= 1} onPress={() => setGuests((value) => Math.max(1, value - 1))} style={[styles.stepButton, guests <= 1 && styles.stepDisabled]}><Text style={styles.stepText}>−</Text></Pressable>
            <Text style={styles.guestCount}>{guests} {guests === 1 ? "guest" : "guests"}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Add one guest" disabled={guests >= 12} onPress={() => setGuests((value) => Math.min(12, value + 1))} style={[styles.stepButton, guests >= 12 && styles.stepDisabled]}><Text style={styles.stepText}>+</Text></Pressable>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={search} style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}><Text style={styles.submitText}>Search</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", borderRadius: 16, borderWidth: 1, borderColor: "#DED6CC", backgroundColor: "#FFFFFF", padding: 14 },
  fields: { gap: 10 },
  fieldsWide: { flexDirection: "row", alignItems: "center" },
  destination: { minHeight: 66, justifyContent: "center", borderWidth: 1, borderColor: "#DED6CC", borderRadius: 12, backgroundColor: "#F7F3EE", paddingHorizontal: 13 },
  destinationWide: { flex: 1.1 },
  label: { color: "#8C8078", fontSize: 10, fontWeight: "700", marginBottom: 7 },
  destinationText: { color: "#1C1916", fontSize: 14, fontWeight: "600" },
  dateRow: { flexDirection: "row", gap: 8 },
  dateRowWide: { flex: 2.2 },
  dateField: { flex: 1, minWidth: 0 },
  guestField: { minHeight: 66, justifyContent: "center", borderWidth: 1, borderColor: "#DED6CC", borderRadius: 12, backgroundColor: "#F7F3EE", paddingHorizontal: 13 },
  guestFieldWide: { flex: 1.1 },
  guestControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#A9834B", borderRadius: 999 },
  stepDisabled: { opacity: 0.4 },
  stepText: { color: "#A9834B", fontSize: 20, lineHeight: 24, fontWeight: "600" },
  guestCount: { color: "#1C1916", fontSize: 14, fontWeight: "600" },
  submit: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#1C1916", paddingHorizontal: 22 },
  submitPressed: { backgroundColor: "#A9834B" },
  submitText: { color: "#F7F3EE", fontSize: 15, fontWeight: "600" },
});