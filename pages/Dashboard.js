import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseChart from '../components/ExpenseChart';
import { PrimaryButton } from '../components/Buttons';
import Container from '../components/Container';
import ScreenHeader from '../components/ScreenHeader';
import { summarizeExpenses } from '../services/chart/summarize';
import { colors, space } from '../theme/tokens';
import { useAppData } from '../state/AppData';

export default function Dashboard({ onAdd, onSeeAll }) {
  const { expenses, expensesReady, expensesError } = useAppData();
  const summary = useMemo(() => summarizeExpenses(expenses), [expenses]);
  const recent = expenses.slice(0, 4);

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Olá" subtitle="Aqui está seu resumo financeiro." />
        <ExpenseChart summary={summary} ready={expensesReady} error={expensesError} expenses={expenses} />
        <PrimaryButton label="Adicionar gasto" onPress={onAdd} />
        <View style={styles.row}>
          <Text style={styles.section}>Últimos gastos</Text>
          {recent.length ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Ver todos" onPress={onSeeAll}>
              <Text style={styles.link}>Ver todos</Text>
            </Pressable>
          ) : null}
        </View>
        {expensesReady && !expensesError && recent.length === 0 ? (
          <Text style={styles.empty}>Nenhum gasto salvo neste aparelho.</Text>
        ) : null}
        {recent.map((expense) => (
          <ExpenseCard key={expense.id} expense={expense} />
        ))}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  row: {
    marginTop: space.xl,
    marginBottom: space.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
  empty: {
    color: colors.muted,
    marginBottom: space.md,
  },
});
