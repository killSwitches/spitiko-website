import { ActivityIndicator, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { SiteLayout, siteStyles } from "@/components/site/site-layout";
import { useMenuItems } from "@/hooks/use-menu-items";

export function GalleryScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { items, loading, error } = useMenuItems();

  return (
    <SiteLayout>
      <View style={siteStyles.content}>
        <Text style={siteStyles.eyebrow}>A CLOSER LOOK</Text>
        <Text style={siteStyles.title}>From our kitchen</Text>
        <Text style={siteStyles.subtitle}>
          A look at the dishes and drinks on the Spitiko menu.
        </Text>
        {loading ? (
          <View style={siteStyles.state}>
            <ActivityIndicator color="#34553D" />
            <Text style={siteStyles.stateText}>Loading menu photos…</Text>
          </View>
        ) : error ? (
          <View accessibilityRole="alert" style={siteStyles.state}>
            <Text style={siteStyles.errorText}>Menu photos are temporarily unavailable.</Text>
          </View>
        ) : items.length ? (
        <View style={styles.grid}>
          {items.filter((item) => item.imageUrl).map((item) => (
            <View key={item.id} style={[styles.tile, isWide && styles.tileWide]}>
              <Image source={{ uri: item.imageUrl }} accessibilityLabel={item.name} resizeMode="cover" style={[styles.image, !isWide && styles.imageCompact]} />
              <Text style={styles.caption}>{item.name}</Text>
            </View>
          ))}
        </View>
        ) : (
          <View style={siteStyles.state}>
            <Text style={siteStyles.stateText}>Food photos will appear here as dishes are added to the menu.</Text>
          </View>
        )}
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