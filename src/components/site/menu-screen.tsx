import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MenuCard } from "@/components/site/menu-card";
import { SiteLayout, siteStyles } from "@/components/site/site-layout";
import { useMenuItems } from "@/hooks/use-menu-items";

export function MenuScreen() {
  const { items, loading, error } = useMenuItems();
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...new Set(items.map((item) => item.category))],
    [items],
  );
  const visibleItems =
    category === "All"
      ? items
      : items.filter((item) => item.category === category);

  return (
    <SiteLayout>
      <View style={siteStyles.content}>
        <Text style={siteStyles.eyebrow}>MADE FRESH, SHARED WITH LOVE</Text>
        <Text style={siteStyles.title}>The Spitiko menu</Text>
        <Text style={siteStyles.subtitle}>
          From the first bite to the last, find something made for your table.
        </Text>

        {categories.length > 1 ? (
          <View style={styles.categories}>
            {categories.map((name) => {
              const selected = category === name;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={name}
                  onPress={() => setCategory(name)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {loading ? (
          <View style={siteStyles.state}>
            <ActivityIndicator color="#34553D" />
            <Text style={siteStyles.stateText}>Loading today’s menu…</Text>
          </View>
        ) : error ? (
          <View accessibilityRole="alert" style={siteStyles.state}>
            <Text style={siteStyles.errorText}>
              The menu could not be loaded. Please try again later.
            </Text>
          </View>
        ) : visibleItems.length ? (
          <View style={styles.grid}>
            {visibleItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View style={siteStyles.state}>
            <Text style={styles.emptyTitle}>Our menu is being prepared</Text>
            <Text style={siteStyles.stateText}>
              Check back soon to see what’s cooking at Spitiko.
            </Text>
          </View>
        )}
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 25,
  },
  chip: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D8DCCF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  chipSelected: { backgroundColor: "#34553D", borderColor: "#34553D" },
  chipText: { color: "#4D5C4F", fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: "#FFFFFF" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 18,
    marginTop: 24,
  },
  emptyTitle: { color: "#233528", fontSize: 17, fontWeight: "700", marginBottom: 8 },
});
