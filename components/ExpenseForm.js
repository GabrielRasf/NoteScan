import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { filterCatalog } from '../data/categories';
import {
  applyExpenseEdits,
  createExpense,
  validateExpenseDraft,
} from '../services/expenses/expense';
import { colors, radius, space, type } from '../theme/tokens';
import { PrimaryButton, TextAction } from './Buttons';
import Card from './Card';
import CategoryPicker from './CategoryPicker';
import Container from './Container';
import ScreenHeader from './ScreenHeader';
import TextField from './TextField';

export default function ExpenseForm({
  title,
  subtitle,
  submitLabel,
  initialDraft,
  existingExpense,
  categorySelection,
  onSubmit,
  onCancel,
}) {
  const [description, setDescription] = useState(initialDraft.description || '');
  const [amountText, setAmountText] = useState(initialDraft.amountText || '');
  const [dateText, setDateText] = useState(initialDraft.dateText || '');
  const [category, setCategory] = useState(initialDraft.category || '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const groups = filterCatalog(categorySelection, existingExpense?.category || '');
  const usingAllCategories =
    !categorySelection || Object.values(categorySelection).every((value) => value !== true);

  const handleSubmit = async () => {
    const validation = validateExpenseDraft(
      {
        description,
        amountText,
        dateText,
        category,
        ocrText: initialDraft.ocrText,
      },
      existingExpense?.category
    );
    setErrors(validation.errors);
    if (!validation.ok) return;

    setSaving(true);
    const expense = existingExpense
      ? applyExpenseEdits(existingExpense, validation.fields)
      : createExpense(validation.fields, new Date(), initialDraft.contentId || undefined);
    const result = await onSubmit(expense);
    if (!result?.ok) setSaving(false);
  };

  return (
    <Container edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title={title} subtitle={subtitle} onBack={onCancel} />
        {initialDraft.notice ? <Text style={styles.notice}>{initialDraft.notice}</Text> : null}
        {initialDraft.imageUri ? (
          <Image
            accessibilityLabel="Nota selecionada"
            source={{ uri: initialDraft.imageUri }}
            style={styles.preview}
          />
        ) : null}

        <Card>
          <TextField
            label="Estabelecimento"
            value={description}
            onChangeText={setDescription}
            placeholder="Ex.: Restaurante, mercado"
            autoCapitalize="sentences"
          />
          <TextField
            label="Valor"
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0,00"
            keyboardType="decimal-pad"
            error={errors.amount}
          />
          <TextField
            label="Data"
            value={dateText}
            onChangeText={setDateText}
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            error={errors.date}
          />
        </Card>

        <Text style={styles.section}>Selecione a categoria</Text>
        {usingAllCategories ? (
          <Text style={styles.hint}>
            Nenhuma categoria foi marcada nas preferências. Todas estão disponíveis.
          </Text>
        ) : null}
        <CategoryPicker groups={groups} selected={category} onSelect={setCategory} />
        {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}

        {initialDraft.ocrText ? (
          <Card style={styles.ocrCard}>
            <Text style={styles.section}>Texto extraído</Text>
            <Text selectable style={styles.ocrText}>
              {initialDraft.ocrText}
            </Text>
          </Card>
        ) : null}

        <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={saving} />
        <TextAction label="Cancelar" onPress={onCancel} disabled={saving} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  notice: {
    ...type.body,
    marginBottom: space.lg,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    marginBottom: space.lg,
    backgroundColor: colors.line,
  },
  section: {
    ...type.heading,
    fontSize: 18,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  hint: {
    ...type.muted,
    marginBottom: space.md,
  },
  error: {
    color: colors.danger,
    marginTop: space.sm,
  },
  ocrCard: {
    marginTop: space.lg,
  },
  ocrText: {
    ...type.body,
  },
});
