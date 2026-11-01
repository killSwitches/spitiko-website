import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { formatCents, type Room } from "@/lib/domain";

const fallbackImage = require("@/assets/images/exterior_wide.jpg");

export function RoomCard({ room, checkIn, checkOut, guests }: { room: Room; checkIn?: string; checkOut?: string; guests?: string }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const photo = room.photos?.[0];
  const href = {
    pathname: "/room/[id]" as const,
    params: { id: room.id, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}), ...(guests ? { guests } : {}) },
  };

  return (
    <View style={[styles.card, isWide && styles.cardWide]}>
      <Image source={photo ? { uri: photo } : fallbackImage} accessibilityLabel={room.name} resizeMode="cover" style={[styles.image, isWide && styles.imageWide]} />
      <View style={styles.body}>
        <View style={styles.mainCopy}>
          <Text style={styles.name}>{room.name}</Text>
          <Text style={styles.location}>ORA LODGE · Ga-Masemola</Text>
          <Text numberOfLines={3} style={styles.description}>{room.description || "A comfortable private room at ORA LODGE."}</Text>
          <Text style={styles.capacity}>Sleeps up to {room.capacity || 2}</Text>
          <View style={styles.amenities}>{(room.amenities ?? []).slice(0, 3).map((amenity) => <Text key={amenity} style={styles.amenity}>{amenity}</Text>)}</View>
        </View>
        <View style={[styles.priceArea, isWide && styles.priceAreaWide]}>
          <View style={styles.priceCopy}>
            {room.nightlyRateCents != null && <Text style={styles.price}>{formatCents(room.nightlyRateCents)} <Text style={styles.unit}>/ night</Text></Text>}
            {room.hourlyRateCents != null && <Text style={styles.secondaryPrice}>{formatCents(room.hourlyRateCents)} / hour</Text>}
            <Text style={styles.taxNote}>Rates shown before confirmation</Text>
          </View>
          <Link href={href} asChild><Pressable accessibilityRole="link" style={styles.cta}><Text style={styles.ctaText}>See availability</Text><Text style={styles.arrow}>›</Text></Pressable></Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderWidth: 1, borderColor: "#DED6CC", borderRadius: 16, backgroundColor: "#FFFFFF", marginTop: 14 },
  cardWide: { minHeight: 220, flexDirection: "row" },
  image: { width: "100%", height: 210, backgroundColor: "#EDE8E0" },
  imageWide: { width: 245, height: "100%", minHeight: 220 },
  body: { flex: 1, padding: 17, gap: 16 },
  mainCopy: { flex: 1 },
  name: { color: "#1C1916", fontSize: 19, lineHeight: 25, fontWeight: "600" },
  location: { color: "#8C8078", fontSize: 12, fontWeight: "600", marginTop: 4 },
  description: { color: "#4A4540", fontSize: 14, lineHeight: 21, marginTop: 10 },
  capacity: { color: "#1C1916", fontSize: 13, fontWeight: "600", marginTop: 10 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  amenity: { color: "#4A4540", fontSize: 12, backgroundColor: "#EDE8E0", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  priceArea: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderTopColor: "#DED6CC", paddingTop: 13 },
  priceAreaWide: { width: 230, flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end", borderTopWidth: 0, paddingTop: 0 },
  priceCopy: { alignItems: "flex-end" },
  price: { color: "#1C1916", fontSize: 18, fontWeight: "600" },
  unit: { color: "#8C8078", fontSize: 12, fontWeight: "500" },
  secondaryPrice: { color: "#4A4540", fontSize: 13, marginTop: 4 },
  taxNote: { color: "#8C8078", fontSize: 10, marginTop: 5 },
  cta: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, backgroundColor: "#1C1916", paddingHorizontal: 18 },
  ctaPressed: { backgroundColor: "#A9834B" },
  ctaText: { color: "#F7F3EE", fontSize: 13, fontWeight: "600" },
  arrow: { color: "#FFFFFF", fontSize: 21, lineHeight: 24, fontWeight: "500" },
});