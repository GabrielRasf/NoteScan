import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { TextAction } from '../components/Buttons';
import Container from '../components/Container';
import ExpenseForm from '../components/ExpenseForm';
import { draftFromExpense } from '../services/expenses/expense';
import { temporaryFiles } from '../services/files/temporaryFiles';
import { deleteReceiptImage, storeReceiptImage } from '../services/receipts/receiptFiles';
import { showMessage } from '../services/ui/dialogs';
import { useAppData } from '../state/AppData';

export default function Review({ navigation, route }) {
  const { expenses, expensesReady, categorySelection, addExpense, editExpense } = useAppData();
  const expenseId = route.params?.expenseId;
  const existing = expenseId ? expenses.find((item) => item.id === expenseId) : null;
  const initialDraft = existing ? draftFromExpense(existing) : route.params?.draft;
  const captureContentId = route.params?.draft?.contentId || null;

  useEffect(() => {
    if (!captureContentId) return undefined;
    return () => {
      temporaryFiles.deleteForContent(captureContentId);
    };
  }, [captureContentId]);

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
        let toSave = expense;
        let storedPath = null;
        const tempId = !existing ? initialDraft.imageTempId : null;
        if (!existing && initialDraft.imageUri) {
          let stored;
          try {
            stored = tempId
              ? await temporaryFiles.use(tempId, (uri) => storeReceiptImage(uri, expense.id))
              : storeReceiptImage(initialDraft.imageUri, expense.id);
          } catch (error) {
            stored = { ok: false, reason: 'failed' };
          }
          if (stored.ok) {
            storedPath = stored.path;
            toSave = { ...expense, receiptImage: stored.path };
          } else if (stored.reason !== 'unsupported') {
            showMessage('Erro', 'Não foi possível guardar a foto da nota.');
            return { ok: false };
          }
        }

        const result = existing ? await editExpense(existing.id, toSave) : await addExpense(toSave);
        if (!result.ok) {
          if (storedPath) deleteReceiptImage(storedPath);
          showMessage('Erro', 'Não foi possível salvar o gasto.');
          return result;
        }
        if (tempId) temporaryFiles.delete(tempId);
        navigation.goBack();
        return result;
      }}
    />
  );
}
