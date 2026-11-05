import { Link, usePathname } from "expo-router";
import { BowlFood, List, ShoppingBag, X } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/cart-context";
import { siteColors } from "@/constants/site-theme";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/reserve", label: "Reserve" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { itemCount } = useCart();
  const isWide = width >= 1000;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={[styles.inner, isWide ? styles.innerWide : styles.innerCompact]}>
        <View style={[styles.topRow, !isWide && styles.topRowCompact]}>
          <Link href="/" asChild>
            <Pressable accessibilityRole="link" style={styles.brand}>
              <View style={styles.brandMark}>
                <BowlFood size={21} color="#FFFFFF" weight="regular" />
              </View>
              <View>
                <Text style={styles.brandName}>spitiko</Text>
                <Text style={styles.brandPlace}>A TABLE FROM HOME</Text>
              </View>
            </Pressable>
          </Link>
          {!isWide && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              accessibilityState={{ expanded: menuOpen }}
              onPress={() => setMenuOpen((open) => !open)}
              hitSlop={8}
              style={({ pressed }) => [styles.menuToggle, pressed && styles.menuTogglePressed]}
            >
              {menuOpen ? <X size={24} color={siteColors.ink} /> : <List size={24} color={siteColors.ink} />}
            </Pressable>
          )}
        </View>
        {(isWide || menuOpen) && (
          <View style={[styles.navigation, isWide ? styles.navigationWide : styles.navigationCompact]}>
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityState={{ selected: active }}
                    onPress={() => setMenuOpen(false)}
                    style={StyleSheet.flatten([styles.navLink, !isWide && styles.navLinkCompact, active && styles.navLinkActive])}
                  >
                    <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
                  </Pressable>
                </Link>
              );
            })}
            <Link href="/cart" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Your order, ${itemCount} items`}
                onPress={() => setMenuOpen(false)}
                style={StyleSheet.flatten([styles.cartButton, !isWide && styles.searchButtonCompact])}
              >
                <ShoppingBag size={18} color="#FFFFFF" weight="bold" />
                <Text style={styles.searchButtonText}>Order{itemCount ? ` (${itemCount})` : ""}</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: siteColors.paper, borderBottomWidth: 1, borderBottomColor: siteColors.border, zIndex: 5 },
  inner: { width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: 20 },
  innerWide: { minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 24 },
  innerCompact: { paddingTop: 4, paddingBottom: 8 },
  topRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topRowCompact: { width: "100%" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: siteColors.olive },
  brandName: { color: siteColors.ink, fontSize: 23, fontFamily: "Georgia" },
  brandPlace: { color: siteColors.muted, fontSize: 9, fontWeight: "600", marginTop: 2, letterSpacing: 0.8 },
  menuToggle: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  menuTogglePressed: { backgroundColor: siteColors.oliveSoft },
  navigation: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  navigationWide: { flex: 1, justifyContent: "flex-end" },
  navigationCompact: { flexDirection: "column", alignItems: "stretch", borderTopWidth: 1, borderTopColor: siteColors.border, marginTop: 8, paddingTop: 10, paddingBottom: 4 },
  navLink: { minHeight: 38, justifyContent: "center", paddingHorizontal: 13, borderRadius: 6 },
  navLinkCompact: { minHeight: 46, paddingHorizontal: 14, borderRadius: 6 },
  navLinkActive: { backgroundColor: siteColors.oliveSoft },
  navText: { color: siteColors.body, fontSize: 14, fontWeight: "500" },
  navTextActive: { color: siteColors.oliveDark, fontWeight: "700" },
  cartButton: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: siteColors.oliveDark, borderRadius: 6, marginLeft: 5, paddingHorizontal: 15 },
  searchButtonCompact: { minHeight: 46, alignItems: "center", marginLeft: 0, marginTop: 6 },
  searchButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});