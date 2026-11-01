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
import { useMenuItems } from "@/hooks/use-menu-items";

const heroImage =
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=85";

export function HomeScreen() {
  const { items, loading, error } = useMenuItems();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const featured = items.filter((item) => item.featured || item.offer);

  return (
    <SiteLayout>
      <View style={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>A little taste of home</Text>
            </View>
            <Text style={[styles.heroTitle, !isWide && styles.heroTitleCompact]}>
              Come hungry.
              {"\n"}Leave feeling{" "}
              <Text style={styles.heroAccent}>at home.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Good food, generous plates and the kind of welcome that brings
              everyone to the table.
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
            <View style={styles.heroNote}>
              <Text style={styles.heroNoteText}>
                Made with care · Shared with everyone
              </Text>
            </View>
          </View>
          <View style={[styles.heroPhotoFrame, isWide && styles.heroPhotoFrameWide]}>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroPhoto}
              resizeMode="cover"
              accessibilityLabel="A fresh meal prepared at Spitiko"
            />
            <View style={styles.photoCaption}>
              <Text style={styles.photoCaptionTitle}>Gather around</Text>
              <Text style={styles.photoCaptionBody}>
                There’s always room at our table.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeading}>
            <View style={styles.headingCopy}>
              <Text style={styles.sectionKicker}>THE GOOD STUFF</Text>
              <Text style={styles.sectionTitle}>A few favourites</Text>
              <Text style={styles.sectionIntro}>
                Fresh from our kitchen and ready for your table.
              </Text>
            </View>
            <Link href="/menu" asChild>
              <Pressable accessibilityRole="link" style={styles.textLink}>
                <Text style={styles.textLinkText}>See the full menu</Text>
              </Pressable>
            </Link>
          </View>

          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color="#34553D" />
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
              <Text style={styles.stateTitle}>The menu is on its way</Text>
              <Text style={styles.stateText}>
                Our kitchen is getting everything ready. Come back soon to see
                what’s cooking.
              </Text>
            </View>
          )}

          <View style={[styles.invite, isWide && styles.inviteWide]}>
            <View style={styles.inviteCopy}>
              <Text style={styles.inviteTitle}>Make it a meal together</Text>
              <Text style={styles.inviteText}>
                Choose your favourites, tell us how many to make, and send your
                order straight to our team.
              </Text>
            </View>
            <Link href="/menu" asChild>
              <Pressable accessibilityRole="link" style={styles.inviteButton}>
                <Text style={styles.inviteButtonText}>Start an order</Text>
              </Pressable>
            </Link>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Spitiko</Text>
          <Text style={styles.footerText}>A table from home.</Text>
        </View>
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#F7F8F3", minHeight: "100%" },
  hero: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 38,
    gap: 30,
  },
  heroWide: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 55,
    gap: 44,
  },
  heroCopy: { flex: 1, paddingVertical: 8 },
  heroCopyWide: { paddingLeft: 22 },
  openBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    backgroundColor: "#E8EEE2",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  openDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: "#65824D" },
  openText: { color: "#456044", fontSize: 12, fontWeight: "600" },
  heroTitle: {
    color: "#263B2D",
    fontSize: 58,
    lineHeight: 65,
    fontFamily: "Georgia",
    marginTop: 22,
    letterSpacing: -1.6,
  },
  heroTitleCompact: { fontSize: 43, lineHeight: 49, marginTop: 17 },
  heroAccent: { color: "#77935B", fontStyle: "italic" },
  heroSubtitle: {
    color: "#667064",
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 470,
    marginTop: 15,
  },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginTop: 23 },
  primaryButton: {
    minHeight: 49,
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#34553D",
    paddingHorizontal: 20,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  reserveButton: {
    minHeight: 49,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD4C5",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  reserveButtonText: { color: "#34553D", fontSize: 14, fontWeight: "700" },
  heroNote: { borderTopWidth: 1, borderTopColor: "#E6E9E1", marginTop: 28, paddingTop: 15 },
  heroNoteText: { color: "#7A8378", fontSize: 12 },
  heroPhotoFrame: {
    height: 310,
    width: "100%",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#DCE3D5",
    position: "relative",
  },
  heroPhotoFrameWide: { flex: 1 },
  heroPhoto: { width: "100%", height: "100%" },
  photoCaption: {
    position: "absolute",
    left: 14,
    bottom: 14,
    right: 14,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  photoCaptionTitle: { color: "#293D2F", fontSize: 14, fontWeight: "700" },
  photoCaptionBody: { color: "#758073", fontSize: 12, marginTop: 3 },
  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 27,
    paddingBottom: 48,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
  },
  headingCopy: { flex: 1, minWidth: 220 },
  sectionKicker: { color: "#73865C", fontSize: 11, fontWeight: "700" },
  sectionTitle: {
    color: "#263B2D",
    fontSize: 30,
    lineHeight: 37,
    fontFamily: "Georgia",
    marginTop: 7,
  },
  sectionIntro: { color: "#727C70", fontSize: 14, marginTop: 6 },
  textLink: { minHeight: 40, justifyContent: "center", paddingHorizontal: 5 },
  textLinkText: { color: "#34553D", fontSize: 13, fontWeight: "700" },
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E5DA",
    backgroundColor: "#FFFFFF",
    padding: 22,
    marginTop: 20,
  },
  stateTitle: { color: "#263B2D", fontSize: 18, fontWeight: "700", marginBottom: 7 },
  stateText: { color: "#70796D", fontSize: 14, lineHeight: 22, marginTop: 10 },
  errorText: { color: "#A74236", fontSize: 14, lineHeight: 22 },
  invite: {
    marginTop: 37,
    borderRadius: 18,
    backgroundColor: "#E8EEE2",
    padding: 22,
    gap: 18,
  },
  inviteWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 28 },
  inviteCopy: { flex: 1 },
  inviteTitle: { color: "#2D4935", fontSize: 20, fontWeight: "700" },
  inviteText: { color: "#647260", fontSize: 13, lineHeight: 20, marginTop: 7, maxWidth: 610 },
  inviteButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#34553D",
    paddingHorizontal: 18,
  },
  inviteButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  footer: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E4E8DE",
    paddingVertical: 24,
  },
  footerBrand: { color: "#34553D", fontSize: 20, fontWeight: "700" },
  footerText: { color: "#7B8478", fontSize: 12, marginTop: 3 },
});
