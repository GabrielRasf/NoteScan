import React from 'react';
import { Alert, Text } from 'react-native';
import { TextAction } from '../components/Buttons';
import Container from '../components/Container';
import ExpenseForm from '../components/ExpenseForm';
import { draftFromExpense } from '../services/expenses/expense';
import { useAppData } from '../state/AppData';

export default function Review({ navigation, route }) {
  const { expenses, expensesReady, categorySelection, addExpense, editExpense } = useAppData();
  const expenseId = route.params?.expenseId;
  const existing = expenseId ? expenses.find((item) => item.id === expenseId) : null;
  const initialDraft = existing ? draftFromExpense(existing) : route.params?.draft;

  if (expenseId && !expensesReady) {
    return (
      <Container edges={['top', 'left', 'right', 'bottom']}>
        <Text>Carregando gasto...</Text>
      </Container>
    );
  }

  if (!initialDraft) {
    return (
      <Container edges={['top', 'left', 'right', 'bottom']}>
        <Text>Este gasto não está mais salvo neste aparelho.</Text>
        <TextAction label="Voltar" onPress={() => navigation.goBack()} />
      </Container>
    );
  }

  return (
    <ExpenseForm
      title={existing ? 'Editar gasto' : 'Revisar informações'}
      subtitle={
        existing
          ? 'Altere os dados deste gasto.'
          : 'Confira os dados extraídos da nota. Você pode editar se necessário.'
      }
      submitLabel="Salvar gasto"
      initialDraft={initialDraft}
      existingExpense={existing}
      categorySelection={categorySelection}
      onCancel={() => navigation.goBack()}
      onSubmit={async (expense) => {
        const result = existing ? await editExpense(existing.id, expense) : await addExpense(expense);
        if (!result.ok) {
          Alert.alert('Erro', 'Não foi possível salvar o gasto.');
          return result;
        }
        navigation.goBack();
        return result;
      }}
    />
  );
}
