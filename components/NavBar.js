import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Chart from '../pages/Chart';
import Dashboard from '../pages/Dashboard';
import Expenses from '../pages/Expenses';
import More from '../pages/More';
import { colors, space } from '../theme/tokens';

const TABS = [
  { key: 'home', label: 'Início', icon: 'home', testID: 'tab-home' },
  { key: 'expenses', label: 'Gastos', icon: 'receipt', testID: 'tab-expenses' },
  { key: 'chart', label: 'Gráfico', icon: 'pie-chart', testID: 'tab-chart' },
  { key: 'more', label: 'Mais', icon: 'more-horiz', testID: 'tab-more' },
];

export default function NavBar() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const openCapture = () => navigation.navigate('Camera');

  const scene = [
    <Dashboard key="home" onAdd={openCapture} onSeeAll={() => setIndex(1)} />,
    <Expenses key="expenses" />,
    <Chart key="chart" />,
    <More key="more" />,
  ][index];

  return (
    <View style={styles.root}>
      <View style={styles.scene}>{scene}</View>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
        {TABS.slice(0, 2).map((tab, tabIndex) => (
          <TabButton key={tab.key} tab={tab} selected={index === tabIndex} onPress={() => setIndex(tabIndex)} />
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar gasto"
          testID="tab-add"
          onPress={openCapture}
          style={styles.add}
        >
          <MaterialIcons name="add" size={28} color={colors.white} />
        </Pressable>
        {TABS.slice(2).map((tab, offset) => (
          <TabButton
            key={tab.key}
            tab={tab}
            selected={index === offset + 2}
            onPress={() => setIndex(offset + 2)}
          />
        ))}
      </View>
    </View>
  );
}

function TabButton({ tab, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected }}
      testID={tab.testID}
      onPress={onPress}
      style={styles.tab}
    >
      <MaterialIcons name={tab.icon} size={22} color={selected ? colors.primary : colors.muted} />
      <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scene: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    minHeight: 48,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primary,
  },
  add: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    marginHorizontal: space.sm,
  },
});
