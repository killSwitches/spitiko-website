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
import { siteColors } from "@/constants/site-theme";
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
        <Text style={siteStyles.eyebrow}>FROM OUR KITCHEN</Text>
        <Text style={siteStyles.title}>What’s cooking</Text>
        <Text style={siteStyles.subtitle}>
          Browse the menu and choose something for the table.
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
            <ActivityIndicator color={siteColors.olive} />
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
    borderRadius: 5,
    borderWidth: 1,
    borderColor: siteColors.border,
    backgroundColor: siteColors.surface,
    paddingHorizontal: 16,
  },
  chipSelected: { backgroundColor: siteColors.oliveDark, borderColor: siteColors.oliveDark },
  chipText: { color: siteColors.body, fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: "#FFFFFF" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 18,
    marginTop: 24,
  },
  emptyTitle: { color: siteColors.ink, fontSize: 17, fontWeight: "700", marginBottom: 8 },
});
