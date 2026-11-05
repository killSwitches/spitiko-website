import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { SiteHeader } from "@/components/site/site-header";
import { siteColors } from "@/constants/site-theme";

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
  content: { width: "100%", maxWidth: 1160, alignSelf: "center", paddingHorizontal: 24, paddingTop: 38, paddingBottom: 64 },
  title: { color: siteColors.ink, fontSize: 34, lineHeight: 42, fontFamily: "Georgia" },
  subtitle: { color: siteColors.body, fontSize: 15, lineHeight: 24, marginTop: 9, maxWidth: 680 },
  eyebrow: { color: siteColors.olive, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 9 },
  sectionTitle: { color: siteColors.ink, fontSize: 22, lineHeight: 29, fontWeight: "600" },
  section: { marginTop: 34 },
  state: { minHeight: 120, justifyContent: "center", borderWidth: 1, borderColor: siteColors.border, borderRadius: 8, backgroundColor: siteColors.surface, padding: 22, marginTop: 20 },
  stateText: { color: siteColors.body, fontSize: 14, lineHeight: 22 },
  errorText: { color: siteColors.danger, fontSize: 14, lineHeight: 21 },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: siteColors.paper },
  scroll: { flex: 1, backgroundColor: siteColors.paper },
  scrollContent: { flexGrow: 1 },
});