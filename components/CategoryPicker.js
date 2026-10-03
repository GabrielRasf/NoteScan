import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme/tokens';
import { visualForCategory } from './categoryVisual';

export default function CategoryPicker({ groups, selected, onSelect }) {
  return (
    <View>
      <Text style={styles.label}>Categoria</Text>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.grid}>
            {group.subcategories.map((name) => {
              const active = selected === name;
              const visual = visualForCategory(name);
              return (
                <Pressable
                  key={`${group.title}-${name}`}
                  testID={`category-${name}`}
                  accessibilityRole="button"
                  accessibilityLabel={name}
                  accessibilityState={{ selected: active }}
                  onPress={() => onSelect(name)}
                  style={[styles.card, active && styles.cardSelected]}
                >
                  <View style={[styles.icon, { backgroundColor: visual.tint }]}>
                    <MaterialIcons name={visual.icon} size={22} color={active ? colors.primary : visual.color} />
                  </View>
                  <Text style={[styles.name, active && styles.nameSelected]}>{name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: space.sm,
  },
  group: {
    marginBottom: space.md,
  },
  groupTitle: {
    color: colors.muted,
    fontWeight: '700',
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    minHeight: 108,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    marginBottom: space.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  name: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  nameSelected: {
    color: colors.primaryDark,
  },
});
