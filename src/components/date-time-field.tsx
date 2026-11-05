import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { siteColors } from "@/constants/site-theme";

interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumValue: string;
}

function toLocalInputValue(date: Date) {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimeField({ label, value, onChange, minimumValue }: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<"date" | "time">("date");
  const parsedValue = new Date(value);
  const parsedMinimum = new Date(minimumValue);
  const selectedDate = Number.isFinite(parsedValue.getTime()) ? parsedValue : new Date();
  const minimumDate = Number.isFinite(parsedMinimum.getTime()) ? parsedMinimum : new Date();

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") {
      setOpen(false);
      return;
    }
    if (!date) return;
    if (Platform.OS === "android" && androidStep === "date") {
      const current = new Date(value);
      current.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      onChange(toLocalInputValue(current));
      setAndroidStep("time");
      return;
    }
    onChange(toLocalInputValue(date));
    if (Platform.OS !== "ios") setOpen(false);
    setAndroidStep("date");
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === "web" ? (
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          style={styles.input}
          {...({ type: "datetime-local", min: minimumValue } as object)}
        />
      ) : (
        <>
          <Pressable accessibilityRole="button" onPress={() => { setAndroidStep("date"); setOpen((current) => !current); }} style={styles.input}>
            <Text style={styles.value}>{selectedDate.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</Text>
          </Pressable>
          {open ? (
            <DateTimePicker
              value={selectedDate}
              minimumDate={minimumDate}
              mode={Platform.OS === "ios" ? "datetime" : androidStep}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleChange}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: siteColors.body, fontSize: 13, fontWeight: "600", marginBottom: 7 },
  input: { minHeight: 48, justifyContent: "center", borderWidth: 1, borderColor: siteColors.border, borderRadius: 5, backgroundColor: siteColors.input, paddingHorizontal: 12, paddingVertical: 10 },
  value: { color: siteColors.ink, fontSize: 14 },
});
