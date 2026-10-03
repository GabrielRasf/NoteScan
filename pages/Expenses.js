import React from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import ExpenseCard from '../components/ExpenseCard';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import { space } from '../theme/tokens';
import { useAppData } from '../state/AppData';
import { useNavigation } from '@react-navigation/native';

export default function Expenses() {
  const navigation = useNavigation();
  const { expenses, expensesReady, expensesError, deleteExpense } = useAppData();

  const confirmDelete = (expense) => {
    Alert.alert('Excluir gasto', 'O gasto será removido deste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteExpense(expense.id),
      },
    ]);
  };

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Meus gastos" subtitle="Lançamentos salvos neste aparelho." />
        {!expensesReady ? <Text>Carregando gastos...</Text> : null}
        {expensesError ? <Text style={styles.error}>{expensesError}</Text> : null}
        {expensesReady && !expensesError && expenses.length === 0 ? (
          <EmptyState
            title="Nenhum gasto ainda"
            message="Comece a registrar seus gastos para ver o resumo aqui."
          />
        ) : null}
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={() => navigation.navigate('Review', { expenseId: expense.id })}
            onDelete={() => confirmDelete(expense)}
          />
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
  error: {
    color: '#8C3A3A',
    marginBottom: space.md,
  },
});
