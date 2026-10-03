import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatBrl } from '../services/expenses/money';
import { colors, space, type } from '../theme/tokens';
import { colorForIndex } from './categoryVisual';

function percentShares(summary) {
  const total = summary.reduce((sum, item) => sum + item.total, 0);
  if (total <= 0) return summary.map(() => 0);
  const exact = summary.map((item) => (item.total / total) * 100);
  const floors = exact.map((value) => Math.floor(value));
  let leftover = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);
  const shares = [...floors];
  for (let step = 0; step < leftover; step += 1) {
    shares[order[step].index] += 1;
  }
  return shares;
}

export default function DistributionChart({ summary }) {
  const total = summary.reduce((sum, item) => sum + item.total, 0);
  const shares = percentShares(summary);
  const size = 176;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let consumed = 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.donutBox}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.line}
            strokeWidth={stroke}
            fill="none"
          />
          {summary.map((item, index) => {
            const length = total > 0 ? (item.total / total) * circumference : 0;
            const circle = (
              <Circle
                key={item.category}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colorForIndex(index)}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-consumed}
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            );
            consumed += length;
            return circle;
          })}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerLabel}>Total</Text>
          <Text style={styles.centerValue}>{formatBrl(total)}</Text>
        </View>
      </View>
      {summary.map((item, index) => (
        <View key={item.category} style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: colorForIndex(index) }]} />
          <Text style={styles.name}>{item.category}</Text>
          <Text style={styles.share}>{shares[index]}%</Text>
          <Text style={styles.value}>{formatBrl(item.total)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  donutBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    maxWidth: 110,
  },
  centerLabel: type.muted,
  centerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: space.sm,
  },
  name: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
  },
  share: {
    color: colors.muted,
    width: 42,
    textAlign: 'right',
    marginRight: space.sm,
  },
  value: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
});
