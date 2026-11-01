import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Plus } from "phosphor-react-native";

import { useCart } from "@/context/cart-context";
import type { MenuItem } from "@/lib/menu";
import { formatMenuPrice, getMenuPriceCents } from "@/lib/menu";

export function MenuCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={item.name}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackText}>Spitiko kitchen</Text>
          </View>
        )}
        {item.offer ? (
          <View style={styles.offerPill}>
            <Text style={styles.offerText}>Today’s special</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.details}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <Text numberOfLines={3} style={styles.description}>
          {item.description}
        </Text>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.price}>
              {formatMenuPrice(getMenuPriceCents(item))}
            </Text>
            {getMenuPriceCents(item) < item.priceCents ? (
              <Text style={styles.oldPrice}>{formatMenuPrice(item.priceCents)}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} to your order`}
            onPress={() => addItem(item)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Plus size={18} color="#FFFFFF" weight="bold" />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 250,
    maxWidth: 370,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E7DF",
  },
  imageWrap: { height: 190, backgroundColor: "#E7E8DE", position: "relative" },
  image: { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallbackText: { color: "#63705C", fontSize: 14, fontWeight: "600" },
  offerPill: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FFF8DB",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  offerText: { color: "#63521F", fontSize: 11, fontWeight: "700" },
  details: { padding: 16 },
  category: {
    color: "#61755D",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  name: {
    color: "#233528",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    marginTop: 6,
  },
  description: { color: "#687168", fontSize: 13, lineHeight: 20, marginTop: 7 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 17,
  },
  price: { color: "#233528", fontSize: 17, fontWeight: "700" },
  oldPrice: { color: "#8B9387", fontSize: 11, textDecorationLine: "line-through", marginTop: 2 },
  addButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 10,
    backgroundColor: "#34553D",
    paddingHorizontal: 12,
  },
  pressed: { opacity: 0.78 },
  addText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
