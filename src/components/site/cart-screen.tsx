import { Link } from "expo-router";
import { Minus, Plus, Trash } from "phosphor-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { SiteLayout, siteStyles } from "@/components/site/site-layout";
import { useCart } from "@/context/cart-context";
import { useMenuItems } from "@/hooks/use-menu-items";
import { useWhatsAppNumber } from "@/hooks/use-whatsapp-number";
import { formatMenuPrice, getMenuPriceCents } from "@/lib/menu";

export function CartScreen() {
  const cart = useCart();
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const { items: liveItems, loading } = useMenuItems();
  const { number: whatsappNumber, error: whatsappError } = useWhatsAppNumber();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderOpened, setOrderOpened] = useState(false);
  const activeItems = useMemo(
    () => new Map(liveItems.map((item) => [item.id, item])),
    [liveItems],
  );
  const orderLines = cart.lines.map((line) => ({
    ...line,
    currentItem: activeItems.get(line.item.id) ?? null,
  }));
  const subtotalCents = orderLines.reduce(
    (total, line) =>
      line.currentItem
        ? total + getMenuPriceCents(line.currentItem) * line.quantity
        : total,
    0,
  );
  const hasUnavailableItems = orderLines.some((line) => !line.currentItem);

  const sendOrder = async () => {
    if (!name.trim() || !phone.trim()) {
      setFeedback("Add your name and phone number so our team can confirm your order.");
      return;
    }
    if (!cart.lines.length) return;
    if (hasUnavailableItems) {
      setFeedback("Remove unavailable dishes before sending your order.");
      return;
    }
    if (whatsappError) {
      setFeedback("The restaurant’s WhatsApp contact is unavailable. Please try again later.");
      return;
    }

    const details = orderLines
      .map(
        ({ currentItem, quantity }) =>
          `• ${quantity} × ${currentItem?.name} — ${formatMenuPrice(currentItem ? getMenuPriceCents(currentItem) * quantity : 0)}`,
      )
      .join("\n");
    const message = [
      "*Spitiko — New food order*",
      "",
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      "",
      details,
      "",
      `*Order total: ${formatMenuPrice(subtotalCents)}*`,
      "",
      "Please confirm availability and collection or delivery details.",
    ].join("\n");

    setSubmitting(true);
    setFeedback("");
    try {
      await Linking.openURL(
        `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
      );
      setOrderOpened(true);
      setFeedback("WhatsApp is open with your order ready to send. Your basket stays here until you change it.");
    } catch {
      setFeedback("WhatsApp could not be opened. Please try again or contact us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <View style={siteStyles.content}>
        <Text style={siteStyles.eyebrow}>YOUR TABLE</Text>
        <Text style={siteStyles.title}>Your order</Text>
        <Text style={siteStyles.subtitle}>
          Check your dishes and send your order to our team.
        </Text>

        {loading && cart.lines.length ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#34553D" />
            <Text style={styles.muted}>Checking today’s menu…</Text>
          </View>
        ) : null}

        {!cart.lines.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your basket is waiting</Text>
            <Text style={styles.muted}>
              Add a dish from the menu and it’ll be ready to order here.
            </Text>
            <Link href="/menu" asChild>
              <Pressable accessibilityRole="link" style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Browse the menu</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <View style={[styles.columns, wide && styles.columnsWide]}>
            <View style={styles.lines}>
              {orderLines.map(({ item, currentItem, quantity }) => {
                const displayItem = currentItem ?? item;
                return (
                  <View key={item.id} style={styles.line}>
                    <View style={styles.lineCopy}>
                      <Text style={styles.itemName}>{displayItem.name}</Text>
                      <Text style={styles.itemPrice}>
                        {formatMenuPrice(getMenuPriceCents(displayItem))}
                      </Text>
                      {!currentItem ? (
                        <Text style={styles.unavailable}>
                          No longer available — remove to continue.
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.controls}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove one ${displayItem.name}`}
                        onPress={() => {
                          cart.removeItem(item.id);
                          setOrderOpened(false);
                        }}
                        style={styles.stepButton}
                      >
                        {quantity === 1 ? (
                          <Trash size={15} color="#456044" />
                        ) : (
                          <Minus size={15} color="#456044" />
                        )}
                      </Pressable>
                      <Text style={styles.quantity}>{quantity}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Add one ${displayItem.name}`}
                        disabled={!currentItem}
                        onPress={() => {
                          if (currentItem) {
                            cart.addItem(currentItem);
                            setOrderOpened(false);
                          }
                        }}
                        style={[styles.stepButton, !currentItem && styles.disabled]}
                      >
                        <Plus size={15} color="#456044" />
                      </Pressable>
                    </View>
                    <Text style={styles.lineTotal}>
                      {formatMenuPrice(getMenuPriceCents(displayItem) * quantity)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryHeading}>
                <Text style={styles.summaryTitle}>Order details</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    cart.clearCart();
                    setOrderOpened(false);
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.muted}>Subtotal</Text>
                <Text style={styles.totalPrice}>{formatMenuPrice(subtotalCents)}</Text>
              </View>
              <Text style={styles.note}>
                Collection or delivery details will be confirmed by our team.
              </Text>
              <Text style={styles.fieldLabel}>Your name</Text>
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setOrderOpened(false);
                }}
                placeholder="Name for the order"
                autoCapitalize="words"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setOrderOpened(false);
                }}
                placeholder="+27..."
                keyboardType="phone-pad"
                style={styles.input}
              />
              {feedback ? (
                <Text accessibilityRole="alert" style={styles.feedback}>
                  {feedback}
                </Text>
              ) : null}
              {whatsappError ? (
                <Text accessibilityRole="alert" style={styles.feedback}>
                  WhatsApp contact is unavailable. Please try again later.
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={submitting || orderOpened || hasUnavailableItems || !!whatsappError}
                onPress={() => void sendOrder()}
                style={[
                  styles.primaryButton,
                  (submitting || orderOpened || hasUnavailableItems || !!whatsappError) && styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting
                    ? "Opening WhatsApp…"
                    : orderOpened
                      ? "Order opened in WhatsApp"
                      : "Send order on WhatsApp"}
                </Text>
              </Pressable>
              {hasUnavailableItems ? (
                <Text style={styles.unavailableNote}>
                  Remove unavailable dishes to continue.
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  columns: { gap: 20, marginTop: 28 },
  columnsWide: { flexDirection: "row", alignItems: "flex-start" },
  lines: {
    flex: 1.5,
    borderWidth: 1,
    borderColor: "#E3E7DE",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 17,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0E9",
    paddingVertical: 17,
  },
  lineCopy: { flex: 1, minWidth: 100 },
  itemName: { color: "#293D2F", fontSize: 15, fontWeight: "700" },
  itemPrice: { color: "#758073", fontSize: 12, marginTop: 5 },
  unavailable: { color: "#A74236", fontSize: 11, lineHeight: 16, marginTop: 5 },
  controls: { flexDirection: "row", alignItems: "center", gap: 9 },
  stepButton: {
    width: 33,
    height: 33,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#EFF3EB",
  },
  disabled: { opacity: 0.4 },
  quantity: { color: "#293D2F", fontSize: 13, fontWeight: "700", minWidth: 14, textAlign: "center" },
  lineTotal: { color: "#293D2F", fontSize: 13, fontWeight: "700", minWidth: 64, textAlign: "right" },
  summary: {
    flex: 1,
    minWidth: 280,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E3E7DE",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 18,
  },
  summaryHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  summaryTitle: { color: "#293D2F", fontSize: 18, fontWeight: "700" },
  clearButton: { minHeight: 34, justifyContent: "center", paddingHorizontal: 7 },
  clearText: { color: "#758073", fontSize: 12, fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EDF0E9",
    marginTop: 17,
    paddingTop: 14,
  },
  totalPrice: { color: "#293D2F", fontSize: 17, fontWeight: "700" },
  muted: { color: "#758073", fontSize: 13, lineHeight: 20 },
  note: { color: "#7C857A", fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 16 },
  fieldLabel: { color: "#435547", fontSize: 12, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: "#DDE3D8",
    borderRadius: 9,
    backgroundColor: "#FBFCFA",
    color: "#293D2F",
    fontSize: 14,
    paddingHorizontal: 11,
  },
  feedback: { color: "#A74236", fontSize: 12, lineHeight: 18, marginTop: 12 },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#34553D",
    paddingHorizontal: 17,
    marginTop: 17,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  disabledButton: { opacity: 0.45 },
  unavailableNote: { color: "#A74236", fontSize: 11, lineHeight: 16, marginTop: 8 },
  empty: {
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E3E7DE",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 24,
    marginTop: 28,
  },
  emptyTitle: { color: "#293D2F", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  loading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
});
