import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { SiteLayout, siteStyles } from "@/components/site/site-layout";
import { useWhatsAppNumber } from "@/hooks/use-whatsapp-number";

const contact = { phone: "+27787268856", email: "prospermpuru@gmail.com" };

export function ContactScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const { number: whatsapp, error: contactError } = useWhatsAppNumber();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  const sendEnquiry = async (channel: "email" | "whatsapp") => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail.includes("@") || !trimmedMessage) {
      setFeedbackIsError(true);
      setFeedback("Add your name, a valid email address, and a message to continue.");
      return;
    }
    if (channel === "whatsapp" && contactError) {
      setFeedbackIsError(true);
      setFeedback("The restaurant’s WhatsApp contact is unavailable. Please try again later.");
      return;
    }
    const details = [`Name: ${trimmedName}`, `Email: ${trimmedEmail}`, "", trimmedMessage].join("\n");
    const url = channel === "whatsapp"
      ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Spitiko enquiry\n\n${details}`)}`
      : `mailto:${contact.email}?subject=${encodeURIComponent(`Spitiko enquiry from ${trimmedName}`)}&body=${encodeURIComponent(details)}`;
    try {
      await Linking.openURL(url);
      setFeedbackIsError(false);
      setFeedback(`Opening ${channel === "email" ? "your email app" : "WhatsApp"} with your message.`);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setFeedbackIsError(true);
      setFeedback("Unable to open your messaging app. Please use one of the direct contact links.");
    }
  };

  return (
    <SiteLayout>
      <View style={siteStyles.content}>
        <Text style={siteStyles.eyebrow}>WE’RE HERE TO HELP</Text>
        <Text style={siteStyles.title}>Contact Spitiko</Text>
        <Text style={siteStyles.subtitle}>Questions about the menu, your order, or a table reservation? Get in touch.</Text>
        <View style={[styles.columns, isWide && styles.columnsWide]}>
          <View style={styles.direct}>
            <Text style={siteStyles.sectionTitle}>Get in touch</Text>
            <Text style={styles.body}>Our team is happy to help with restaurant enquiries.</Text>
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`tel:${contact.phone}`)} style={styles.directRow}>
              <Text style={styles.directLabel}>Phone</Text><Text style={styles.directValue}>{contact.phone}</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`mailto:${contact.email}`)} style={styles.directRow}>
              <Text style={styles.directLabel}>Email</Text><Text style={styles.directValue}>{contact.email}</Text>
            </Pressable>
            <Pressable accessibilityRole="link" disabled={!!contactError} onPress={() => void Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, "")}`)} style={styles.directRow}>
              <Text style={styles.directLabel}>WhatsApp</Text><Text style={styles.directValue}>{contactError ? "Currently unavailable" : "Chat with our team"}</Text>
            </Pressable>
          </View>
          <View style={styles.form}>
            <Text style={siteStyles.sectionTitle}>Send us a message</Text>
            <Text style={styles.body}>Leave a note and choose how you’d like to send it.</Text>
            {feedback ? <Text accessibilityRole="alert" style={[styles.feedback, feedbackIsError && styles.feedbackError]}>{feedback}</Text> : null}
            <View style={[styles.fieldRow, !isWide && styles.fieldColumn]}>
              <View style={styles.field}><Text style={styles.label}>Full name *</Text><TextInput value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" style={styles.input} /></View>
              <View style={styles.field}><Text style={styles.label}>Email *</Text><TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" style={styles.input} /></View>
            </View>
            <View style={styles.field}><Text style={styles.label}>Message *</Text><TextInput value={message} onChangeText={setMessage} placeholder="How can we help?" multiline numberOfLines={5} textAlignVertical="top" style={[styles.input, styles.textarea]} /></View>
            <View style={[styles.actions, !isWide && styles.actionsCompact]}>
              <Pressable accessibilityRole="button" disabled={!!contactError} onPress={() => void sendEnquiry("whatsapp")} style={[styles.primaryButton, !!contactError && styles.disabled]}><Text style={styles.primaryButtonText}>Send by WhatsApp</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void sendEnquiry("email")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Send by email</Text></Pressable>
            </View>
          </View>
        </View>
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  columns: { gap: 32, marginTop: 30 },
  columnsWide: { flexDirection: "row", alignItems: "flex-start" },
  direct: { flex: 0.85 },
  body: { color: "#4A4540", fontSize: 14, lineHeight: 22, marginTop: 8 },
  directRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: "rgba(28,25,22,0.10)" },
  directLabel: { color: "#8C8078", fontSize: 13 },
  directValue: { flexShrink: 1, color: "#A9834B", fontSize: 13, fontWeight: "600", textAlign: "right" },
  form: { flex: 1.25, borderWidth: 1, borderColor: "#DED6CC", borderRadius: 16, backgroundColor: "#FFFFFF", padding: 18 },
  feedback: { color: "#3E6B43", fontSize: 13, lineHeight: 19, backgroundColor: "#E8F0E6", borderRadius: 12, marginTop: 14, padding: 10 },
  feedbackError: { color: "#B54A3A", backgroundColor: "#F8E8E4" },
  fieldRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  fieldColumn: { flexDirection: "column" },
  field: { flex: 1, minWidth: 0, marginTop: 12 },
  label: { color: "#4A4540", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { minHeight: 46, borderWidth: 1, borderColor: "#DED6CC", borderRadius: 12, backgroundColor: "#F7F3EE", color: "#1C1916", fontSize: 14, paddingHorizontal: 11, paddingVertical: 10 },
  textarea: { minHeight: 120 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  actionsCompact: { flexDirection: "column" },
  primaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#1C1916", paddingHorizontal: 20 },
  primaryButtonText: { color: "#F7F3EE", fontSize: 13, fontWeight: "600" },
  secondaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1C1916", borderRadius: 999, backgroundColor: "#FFFFFF", paddingHorizontal: 20 },
  secondaryButtonText: { color: "#1C1916", fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
