import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, control, radius, space } from '../theme/tokens';

export default function TextField({ label, error, ...props }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: space.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: space.sm,
    color: colors.ink,
  },
  input: {
    minHeight: control.fieldMinHeight,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: space.sm,
    color: colors.danger,
    fontSize: 13,
  },
});
