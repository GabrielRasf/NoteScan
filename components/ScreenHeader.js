import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, space, type } from '../theme/tokens';

export default function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={styles.back}>
          <MaterialIcons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.lg,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
    backgroundColor: colors.surface,
  },
  title: type.heading,
  subtitle: {
    ...type.muted,
    marginTop: space.xs,
  },
});
