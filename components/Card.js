import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, shadow, space } from '../theme/tokens';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    ...shadow.card,
  },
});
