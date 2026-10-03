import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, space, type } from '../theme/tokens';

export default function EmptyState({ title, message }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <MaterialIcons name="receipt-long" size={36} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  title: {
    ...type.heading,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  message: {
    ...type.muted,
    textAlign: 'center',
  },
});
