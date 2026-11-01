import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { SiteHeader } from "@/components/site/site-header";

export function SiteLayout({ children }: PropsWithChildren) {
  return (
    <View style={styles.page}>
      <SiteHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

export const siteStyles = StyleSheet.create({
  content: { width: "100%", maxWidth: 1160, alignSelf: "center", paddingHorizontal: 22, paddingTop: 28, paddingBottom: 48 },
  title: { color: "#1C1916", fontSize: 30, lineHeight: 38, fontWeight: "600" },
  subtitle: { color: "#4A4540", fontSize: 15, lineHeight: 23, marginTop: 8, maxWidth: 720 },
  eyebrow: { color: "#A9834B", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  sectionTitle: { color: "#1C1916", fontSize: 22, lineHeight: 29, fontWeight: "600" },
  section: { marginTop: 34 },
  state: { minHeight: 120, justifyContent: "center", borderWidth: 1, borderColor: "#DED6CC", borderRadius: 16, backgroundColor: "#FFFFFF", padding: 20, marginTop: 18 },
  stateText: { color: "#4A4540", fontSize: 14, lineHeight: 21 },
  errorText: { color: "#B54A3A", fontSize: 14, lineHeight: 21 },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F3EE" },
  scroll: { flex: 1, backgroundColor: "#F7F3EE" },
  scrollContent: { flexGrow: 1 },
});