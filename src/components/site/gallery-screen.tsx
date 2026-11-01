import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { SiteLayout, siteStyles } from "@/components/site/site-layout";

const galleryImages = [
  { source: require("@/assets/images/bathroom.jpg"), label: "Ensuite bathroom" },
  { source: require("@/assets/images/bed_headboard_black.jpg"), label: "Guest bedroom" },
  { source: require("@/assets/images/bed_headboard_grey.jpg"), label: "Comfortable rooms" },
  { source: require("@/assets/images/bedroom_ensuite.jpg"), label: "Ensuite bedroom" },
  { source: require("@/assets/images/bedroom_neutral.jpg"), label: "Warm, restful interiors" },
  { source: require("@/assets/images/exterior_wide.jpg"), label: "ORA LODGE exterior" },
  { source: require("@/assets/images/family_room.jpg"), label: "Family suite" },
  { source: require("@/assets/images/parking_cars.jpg"), label: "Guest parking" },
  { source: require("@/assets/images/sign.jpg"), label: "The lodge entrance" },
  { source: require("@/assets/images/twin_room.jpg"), label: "Twin room" },
] as const;

export function GalleryScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <SiteLayout>
      <View style={siteStyles.content}>
        <Text style={siteStyles.eyebrow}>A CLOSER LOOK</Text>
        <Text style={siteStyles.title}>ORA LODGE GALLERY</Text>
        <Text style={siteStyles.subtitle}>A look around the rooms, grounds, and comforts waiting for you in Ga-Masemola.</Text>
        <View style={styles.grid}>
          {galleryImages.map(({ source, label }) => (
            <View key={label} style={[styles.tile, isWide && styles.tileWide]}>
              <Image source={source} accessibilityLabel={label} resizeMode="cover" style={[styles.image, !isWide && styles.imageCompact]} />
              <Text style={styles.caption}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 22, marginTop: 28 },
  tile: { width: "48%", overflow: "hidden" },
  tileWide: { width: "31.8%" },
  image: { width: "100%", height: 250, borderRadius: 16, backgroundColor: "#EDE8E0" },
  imageCompact: { height: 180 },
  caption: { color: "#4A4540", fontSize: 13, fontWeight: "600", marginTop: 8 },
});