import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { BookingSearch } from "@/components/site/booking-search";
import { RoomCard } from "@/components/site/room-card";
import { SiteLayout, siteStyles } from "@/components/site/site-layout";
import { usePublishedRooms } from "@/hooks/use-published-rooms";

export function RoomsScreen() {
  const { rooms, loading, error } = usePublishedRooms();
  const params = useLocalSearchParams<{ checkIn?: string; checkOut?: string; guests?: string }>();
  const guests = Number(params.guests);
  const filteredRooms = Number.isFinite(guests) && guests > 0 ? rooms.filter((room) => (room.capacity || 2) >= guests) : rooms;

  return (
    <SiteLayout>
      <View style={siteStyles.content}>
        <Text style={siteStyles.eyebrow}>FIND YOUR ROOM</Text>
        <Text style={siteStyles.title}>Rooms at ORA LODGE</Text>
        <Text style={siteStyles.subtitle}>Browse our available thatched cottages and choose the space that suits your stay.</Text>
        <View style={styles.search}><BookingSearch initialCheckIn={params.checkIn} initialCheckOut={params.checkOut} initialGuests={params.guests} /></View>
        <View style={styles.listHeading}>
          <Text style={siteStyles.sectionTitle}>{loading ? "Checking rooms…" : `${filteredRooms.length} ${filteredRooms.length === 1 ? "room" : "rooms"} to explore`}</Text>
          {params.guests && <Text style={styles.filterNote}>Accommodating {guests} guests</Text>}
        </View>
        {loading ? (
          <View style={siteStyles.state}><ActivityIndicator color="#A9834B" /><Text style={siteStyles.stateText}>Loading available rooms…</Text></View>
        ) : error ? (
          <View accessibilityRole="alert" style={siteStyles.state}><Text style={siteStyles.errorText}>Room availability could not be loaded. Please try again later.</Text></View>
        ) : filteredRooms.length ? (
          filteredRooms.map((room) => <RoomCard key={room.id} room={room} checkIn={params.checkIn} checkOut={params.checkOut} guests={params.guests} />)
        ) : (
          <View style={siteStyles.state}><Text style={siteStyles.stateText}>{rooms.length ? "No listed rooms can accommodate that number of guests. Try a smaller group or contact us." : "No rooms are listed right now. Contact us to check availability."}</Text></View>
        )}
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  search: { marginTop: 24 },
  listHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 32 },
  filterNote: { color: "#8C8078", fontSize: 13 },
});