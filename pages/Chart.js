import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Container from '../components/Container';
import ExpenseChart from '../components/ExpenseChart';
import ScreenHeader from '../components/ScreenHeader';
import { summarizeExpenses } from '../services/chart/summarize';
import { space } from '../theme/tokens';
import { useAppData } from '../state/AppData';

export default function Chart() {
  const { expenses, expensesReady, expensesError } = useAppData();
  const summary = useMemo(() => summarizeExpenses(expenses), [expenses]);

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Gráfico de gastos" subtitle="Distribuição calculada dos gastos salvos." />
        <ExpenseChart summary={summary} ready={expensesReady} error={expensesError} expenses={expenses} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
});
