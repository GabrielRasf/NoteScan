import React from 'react';
import { Alert } from 'react-native';
import ExpenseForm from '../components/ExpenseForm';
import { useAppData } from '../state/AppData';

const emptyDraft = {
  description: '',
  amountText: '',
  dateText: '',
  category: '',
  ocrText: null,
  imageUri: null,
  notice: null,
};

export default function ManualEntry({ navigation }) {
  const { categorySelection, addExpense } = useAppData();

  return (
    <ExpenseForm
      title="Novo gasto"
      subtitle="Preencha as informações do seu gasto."
      submitLabel="Salvar gasto"
      initialDraft={emptyDraft}
      categorySelection={categorySelection}
      onCancel={() => navigation.goBack()}
      onSubmit={async (expense) => {
        const result = await addExpense(expense);
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
