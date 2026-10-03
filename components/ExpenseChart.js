import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatBrl } from '../services/expenses/money';
import { periodLabel } from '../services/chart/period';
import { colors, space, type } from '../theme/tokens';
import Card from './Card';
import DistributionChart from './DistributionChart';
import EmptyState from './EmptyState';

const EMPTY_MESSAGE = 'Ainda não há gastos salvos. Fotografe uma nota ou lance um gasto manualmente.';

export default function ExpenseChart({ summary, ready, error, expenses = [] }) {
  if (!ready) {
    return <Text style={styles.muted}>Carregando gastos...</Text>;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  const total = (summary || []).reduce((sum, item) => sum + item.total, 0);

  return (
    <View>
      <Card>
        <View style={styles.statRow}>
          <View>
            <Text style={styles.muted}>Total de gastos</Text>
            <Text style={styles.amount}>{formatBrl(total)}</Text>
          </View>
          <Text style={styles.period}>{periodLabel(expenses)}</Text>
        </View>
      </Card>
      {!summary?.length ? (
        <EmptyState title="Nenhum gasto ainda" message={EMPTY_MESSAGE} />
      ) : (
        <Card style={styles.chartCard}>
          <Text style={styles.totalLine}>Total {formatBrl(total)}</Text>
          <DistributionChart summary={summary} />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
  },
  muted: type.muted,
  amount: type.amount,
  period: {
    ...type.muted,
    fontWeight: '700',
    color: colors.primary,
  },
  chartCard: {
    marginTop: space.lg,
  },
  totalLine: {
    ...type.heading,
    marginBottom: space.md,
  },
  error: {
    color: colors.danger,
    fontSize: 15,
  },
});
