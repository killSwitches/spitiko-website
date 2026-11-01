import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { createElement, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ink = '#1C1916';
const muted = '#8C8078';
const gold = '#A9834B';

export interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumValue?: string;
  maximumValue?: string;
}

type PickerMode = 'date' | 'time';

function parseDate(value: string): Date {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function formatDateTime(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function mergeSelectedValue(current: Date, selected: Date, mode: PickerMode) {
  const next = new Date(selected);
  if (mode === 'date') {
    next.setHours(current.getHours(), current.getMinutes(), 0, 0);
  } else {
    next.setFullYear(current.getFullYear(), current.getMonth(), current.getDate());
    next.setSeconds(0, 0);
  }
  return next;
}

export function DateTimeField({
  label,
  value,
  onChange,
  minimumValue,
  maximumValue,
}: DateTimeFieldProps) {
  const [activeMode, setActiveMode] = useState<PickerMode | null>(null);
  const [pickerError, setPickerError] = useState('');
  const date = parseDate(value);
  const minimumDate = minimumValue ? parseDate(minimumValue) : undefined;
  const maximumDate = maximumValue ? parseDate(maximumValue) : undefined;

  if (Platform.OS === 'web') {
    return (
      <label className="date-time-field">
        <span className="date-time-field__label">{label}</span>
        {createElement('input', {
          type: 'datetime-local',
          className: 'date-time-field__input',
          value,
          min: minimumValue,
          max: maximumValue,
          'aria-label': label,
          onChange: (event) => onChange(event.currentTarget.value),
        })}
      </label>
    );
  }

  const openNativePicker = (mode: PickerMode) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode,
        value: date,
        minimumDate,
        maximumDate,
        is24Hour: true,
        onValueChange: (_, selectedDate) => {
          onChange(formatDateTime(mergeSelectedValue(date, selectedDate, mode)));
          setPickerError('');
        },
        onError: (error) => setPickerError(error.message),
      });
      return;
    }
    setActiveMode((current) => current === mode ? null : mode);
    setPickerError('');
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${date.toLocaleDateString()}`}
          accessibilityHint="Opens the calendar"
          onPress={() => openNativePicker('date')}
          style={[styles.control, activeMode === 'date' && styles.controlActive]}>
          <Text style={styles.controlText}>
            {date.toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
          accessibilityHint="Opens the time picker"
          onPress={() => openNativePicker('time')}
          style={[styles.control, styles.timeControl, activeMode === 'time' && styles.controlActive]}>
          <Text style={styles.controlText}>
            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' && activeMode ? (
        <View style={styles.picker}>
          <DateTimePicker
            value={date}
            mode={activeMode}
            display={activeMode === 'date' ? 'compact' : 'spinner'}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor={gold}
            is24Hour
            onValueChange={(_, selectedDate) => {
              onChange(formatDateTime(mergeSelectedValue(date, selectedDate, activeMode)));
              setPickerError('');
            }}
            onDismiss={() => setActiveMode(null)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveMode(null)}
            style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      ) : null}
      {pickerError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>{pickerError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', marginBottom: 14 },
  label: { color: muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginBottom: 7 },
  controls: { flexDirection: 'row', gap: 8 },
  control: {
    minHeight: 46,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDD7CC',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  timeControl: { flex: 0.65 },
  controlActive: { borderColor: gold },
  controlText: { color: ink, fontSize: 12, fontWeight: '600' },
  picker: { alignItems: 'center', marginTop: 8, padding: 8, backgroundColor: '#F8F6F1', borderRadius: 8 },
  doneButton: { minHeight: 40, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12 },
  doneText: { color: ink, fontWeight: '700' },
  errorText: { color: '#B54A3A', fontSize: 12, marginTop: 6 },
});
