import { Link } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { MenuCard } from "@/components/site/menu-card";
import { SiteLayout } from "@/components/site/site-layout";
import { siteColors } from "@/constants/site-theme";
import { useMenuItems } from "@/hooks/use-menu-items";

const heroImage =
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=85";

export function HomeScreen() {
  const { items, loading, error } = useMenuItems();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const featured = items.filter((item) => item.featured || item.offer);
  const photoItem =
    items.find((item) => item.featured && item.imageUrl) ??
    items.find((item) => item.imageUrl);
  const photoSource = photoItem ? { uri: photoItem.imageUrl } : { uri: heroImage };

  return (
    <SiteLayout>
      <View style={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
            <Text style={styles.heroEyebrow}>SPITIKO · A TABLE FROM HOME</Text>
            <Text style={[styles.heroTitle, !isWide && styles.heroTitleCompact]}>
              Food for the
              {"\n"}whole{" "}
              <Text style={styles.heroAccent}>table.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Comforting favourites, generous plates, and room for one more.
              Find something for the table.
            </Text>
            <View style={styles.heroActions}>
              <Link href="/menu" asChild>
                <Pressable accessibilityRole="link" style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Explore the menu</Text>
                </Pressable>
              </Link>
              <Link href="/reserve" asChild>
                <Pressable accessibilityRole="link" style={styles.reserveButton}>
                  <Text style={styles.reserveButtonText}>Book a table</Text>
                </Pressable>
              </Link>
            </View>
          </View>
          <View style={[styles.heroPhotoFrame, isWide && styles.heroPhotoFrameWide]}>
            <Image
              source={photoSource}
              style={styles.heroPhoto}
              resizeMode="cover"
              accessibilityLabel={photoItem?.name ?? "Food from the Spitiko menu"}
            />
            <View style={styles.photoCaption}>
              <Text style={styles.photoCaptionTitle}>
                {photoItem?.name ?? "A table from home"}
              </Text>
              <Text style={styles.photoCaptionBody}>
                {photoItem?.category ?? "Good food, shared together"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeading}>
            <View style={styles.headingCopy}>
              <Text style={styles.sectionKicker}>ON THE MENU</Text>
              <Text style={styles.sectionTitle}>Worth a look</Text>
              <Text style={styles.sectionIntro}>
                A few dishes to get you started.
              </Text>
            </View>
            <Link href="/menu" asChild>
              <Pressable accessibilityRole="link" style={styles.textLink}>
                <Text style={styles.textLinkText}>View the menu</Text>
              </Pressable>
            </Link>
          </View>

          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={siteColors.olive} />
              <Text style={styles.stateText}>Setting the table…</Text>
            </View>
          ) : error ? (
            <View accessibilityRole="alert" style={styles.state}>
              <Text style={styles.errorText}>
                Today’s menu is temporarily unavailable.
              </Text>
            </View>
          ) : featured.length ? (
            <View style={styles.menuGrid}>
              {featured.slice(0, isWide ? 3 : 2).map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </View>
          ) : items.length ? (
            <View style={styles.menuGrid}>
              {items.slice(0, isWide ? 3 : 2).map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>The menu is being prepared</Text>
              <Text style={styles.stateText}>
                Check back soon to see what’s available.
              </Text>
            </View>
          )}

          <View style={[styles.invite, isWide && styles.inviteWide]}>
            <View style={styles.inviteCopy}>
              <Text style={styles.inviteTitle}>Ready to order?</Text>
              <Text style={styles.inviteText}>
                Choose your dishes and send your order directly to our team.
              </Text>
            </View>
            <Link href="/menu" asChild>
              <Pressable accessibilityRole="link" style={styles.inviteButton}>
                <Text style={styles.inviteButtonText}>Browse the menu</Text>
              </Pressable>
            </Link>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>spitiko</Text>
          <Text style={styles.footerText}>A table from home</Text>
        </View>
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: siteColors.paper, minHeight: "100%" },
  hero: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 46,
    gap: 30,
  },
  heroWide: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 58,
    paddingBottom: 62,
    gap: 52,
  },
  heroCopy: { flex: 1, paddingVertical: 8 },
  heroCopyWide: { paddingLeft: 22 },
  heroEyebrow: { color: siteColors.olive, fontSize: 11, fontWeight: "700", letterSpacing: 0.9 },
  heroTitle: {
    color: siteColors.ink,
    fontSize: 58,
    lineHeight: 65,
    fontFamily: "Georgia",
    marginTop: 22,
    letterSpacing: -1.6,
  },
  heroTitleCompact: { fontSize: 43, lineHeight: 49, marginTop: 17 },
  heroAccent: { color: siteColors.olive, fontStyle: "italic" },
  heroSubtitle: {
    color: siteColors.body,
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 470,
    marginTop: 15,
  },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginTop: 23 },
  primaryButton: {
    minHeight: 49,
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: siteColors.oliveDark,
    paddingHorizontal: 20,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  reserveButton: {
    minHeight: 49,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: siteColors.border,
    borderRadius: 5,
    backgroundColor: siteColors.surface,
    paddingHorizontal: 20,
  },
  reserveButtonText: { color: siteColors.oliveDark, fontSize: 14, fontWeight: "700" },
  heroPhotoFrame: {
    height: 310,
    width: "100%",
    overflow: "hidden",
    borderRadius: 7,
    backgroundColor: siteColors.oliveSoft,
    position: "relative",
  },
  heroPhotoFrameWide: { flex: 1 },
  heroPhoto: { width: "100%", height: "100%" },
  photoCaption: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(255,254,250,0.94)",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  photoCaptionTitle: { color: siteColors.ink, fontSize: 14, fontWeight: "700" },
  photoCaptionBody: { color: siteColors.muted, fontSize: 12, marginTop: 3 },
  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 56,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
  },
  headingCopy: { flex: 1, minWidth: 220 },
  sectionKicker: { color: siteColors.olive, fontSize: 11, fontWeight: "700", letterSpacing: 0.7 },
  sectionTitle: {
    color: siteColors.ink,
    fontSize: 30,
    lineHeight: 37,
    fontFamily: "Georgia",
    marginTop: 7,
  },
  sectionIntro: { color: siteColors.body, fontSize: 14, marginTop: 6 },
  textLink: { minHeight: 40, justifyContent: "center", paddingHorizontal: 5 },
  textLinkText: { color: siteColors.oliveDark, fontSize: 13, fontWeight: "700" },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 18,
    marginTop: 21,
  },
  state: {
    minHeight: 140,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: siteColors.border,
    backgroundColor: siteColors.surface,
    padding: 22,
    marginTop: 20,
  },
  stateTitle: { color: siteColors.ink, fontSize: 18, fontWeight: "700", marginBottom: 7 },
  stateText: { color: siteColors.body, fontSize: 14, lineHeight: 22, marginTop: 10 },
  errorText: { color: siteColors.danger, fontSize: 14, lineHeight: 22 },
  invite: {
    marginTop: 37,
    borderRadius: 7,
    backgroundColor: siteColors.oliveSoft,
    padding: 24,
    gap: 18,
  },
  inviteWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 28 },
  inviteCopy: { flex: 1 },
  inviteTitle: { color: siteColors.oliveDark, fontSize: 20, fontWeight: "700" },
  inviteText: { color: siteColors.body, fontSize: 13, lineHeight: 20, marginTop: 7, maxWidth: 610 },
  inviteButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 5,
    backgroundColor: siteColors.oliveDark,
    paddingHorizontal: 18,
  },
  inviteButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  footer: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: siteColors.border,
    paddingVertical: 24,
  },
  footerBrand: { color: siteColors.oliveDark, fontSize: 20, fontFamily: "Georgia" },
  footerText: { color: siteColors.muted, fontSize: 12, marginTop: 3 },
});
