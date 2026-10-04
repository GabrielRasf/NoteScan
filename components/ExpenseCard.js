import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatBrl } from '../services/expenses/money';
import { colors, radius, space, type } from '../theme/tokens';
import { visualForCategory } from './categoryVisual';

export default function ExpenseCard({ expense, receiptUri, onOpenReceipt, onEdit, onDelete }) {
  const visual = visualForCategory(expense.category);

  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: visual.tint }]}>
        <MaterialIcons name={visual.icon} size={22} color={visual.color} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{expense.description || 'Sem descrição'}</Text>
        <Text style={styles.meta}>{expense.category}</Text>
        <Text style={styles.meta}>{expense.date || 'Sem data'}</Text>
        {receiptUri && onOpenReceipt ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver nota"
            onPress={onOpenReceipt}
            style={styles.receipt}
          >
            <Image source={{ uri: receiptUri }} style={styles.thumbnail} />
            <Text style={styles.action}>Ver nota</Text>
          </Pressable>
        ) : null}
        {onEdit || onDelete ? (
          <View style={styles.actions}>
            {onEdit ? <TextAction label="Editar" onPress={onEdit} /> : null}
            {onDelete ? <TextAction label="Excluir" onPress={onDelete} /> : null}
          </View>
        ) : null}
      </View>
      <Text style={styles.amount}>{formatBrl(expense.amount)}</Text>
    </View>
  );
}

function TextAction({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <Text style={styles.action}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: type.muted,
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginLeft: space.sm,
  },
  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.line,
  },
  actions: {
    flexDirection: 'row',
    gap: space.lg,
    marginTop: space.sm,
  },
  action: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
