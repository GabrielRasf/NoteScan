import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, control, radius, space } from '../theme/tokens';

export function PrimaryButton({ label, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primary, disabled && styles.disabled]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, disabled, icon }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.outline, disabled && styles.disabled]}
    >
      <View style={styles.outlineContent}>
        {icon}
        <Text style={styles.outlineText}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function TextAction({ label, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={styles.textAction}
    >
      <Text style={styles.textActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: control.buttonHeight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  outline: {
    minHeight: control.buttonHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
    paddingHorizontal: space.lg,
  },
  outlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  textAction: {
    marginTop: space.md,
    alignItems: 'center',
    padding: space.sm,
  },
  textActionLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
