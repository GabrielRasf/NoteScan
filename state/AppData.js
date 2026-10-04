import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { listCategories, saveCategories } from '../services/storage/categoriesStore';
import {
  applyDemoLaunch,
  applyDemoPurge,
  resetDemoData,
  seedDemoData,
} from '../services/dev/demoExpenses';
import { deleteExpenseAndFiles } from '../services/expenses/expenseRemoval';
import { temporaryFiles } from '../services/files/temporaryFiles';
import { listExpenses, saveExpense, updateExpense } from '../services/storage/expensesStore';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [expensesReady, setExpensesReady] = useState(false);
  const [expensesError, setExpensesError] = useState(null);
  const [categorySelection, setCategorySelection] = useState({});
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const reload = useCallback(async () => {
    const [expenseResult, categoryResult] = await Promise.all([
      listExpenses(),
      listCategories(),
    ]);

    setExpenses(expenseResult.value);
    setExpensesReady(true);
    setExpensesError(
      expenseResult.ok ? null : 'Não foi possível ler os gastos salvos neste aparelho.'
    );
    setCategorySelection(categoryResult.value);
    setCategoriesReady(true);
    setCategoriesError(
      categoryResult.ok ? null : 'Não foi possível ler as categorias salvas neste aparelho.'
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    temporaryFiles.cleanupOrphans();
    temporaryFiles.cleanup();

    (async () => {
      await reload();
      const purged = await applyDemoPurge();
      if (!cancelled && purged.purged) {
        setExpenses(purged.value);
        setExpensesError(null);
        if (purged.categories) setCategorySelection(purged.categories);
      }
      const demo = await applyDemoLaunch();
      if (cancelled || !demo.applied) return;
      setExpenses(demo.value);
      setExpensesError(null);
      if (demo.categories) setCategorySelection(demo.categories);
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  const addExpense = useCallback(async (expense) => {
    const result = await saveExpense(expense);
    if (!result.ok) {
      setExpensesError('Não foi possível salvar o gasto.');
      return { ok: false };
    }
    setExpenses(result.value);
    setExpensesError(null);
    return { ok: true };
  }, []);

  const editExpense = useCallback(async (id, expense) => {
    const result = await updateExpense(id, expense);
    if (!result.ok) {
      setExpensesError('Não foi possível atualizar o gasto.');
      return { ok: false };
    }
    setExpenses(result.value);
    setExpensesError(null);
    return { ok: true };
  }, []);

  const deleteExpense = useCallback(async (id) => {
    const result = await deleteExpenseAndFiles(id);
    if (!result.ok) {
      setExpensesError('Não foi possível remover o gasto.');
      return { ok: false };
    }
    setExpenses(result.value);
    setExpensesError(null);
    return { ok: true };
  }, []);

  const saveCategorySelection = useCallback(async (selection) => {
    const result = await saveCategories(selection);
    if (!result.ok) {
      setCategoriesError('Não foi possível salvar suas preferências.');
      return { ok: false, value: categorySelection };
    }
    setCategorySelection(result.value);
    setCategoriesError(null);
    return { ok: true, value: result.value };
  }, [categorySelection]);

  const loadDemoExpenses = useCallback(async () => {
    const result = await seedDemoData();
    if (!result.ok) {
      setExpensesError('Não foi possível gerar os dados de demonstração.');
      return result;
    }
    setExpenses(result.value);
    setExpensesError(null);
    if (result.categories) setCategorySelection(result.categories);
    return result;
  }, []);

  const deleteDemoData = useCallback(async () => {
    const result = await resetDemoData();
    if (!result.ok) {
      setExpensesError('Não foi possível remover os dados de demonstração.');
      return result;
    }
    setExpenses(result.value);
    setExpensesError(null);
    if (result.categories) setCategorySelection(result.categories);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      expenses,
      expensesReady,
      expensesError,
      categorySelection,
      categoriesReady,
      categoriesError,
      addExpense,
      editExpense,
      deleteExpense,
      saveCategorySelection,
      loadDemoExpenses,
      deleteDemoData,
    }),
    [
      expenses,
      expensesReady,
      expensesError,
      categorySelection,
      categoriesReady,
      categoriesError,
      addExpense,
      editExpense,
      deleteExpense,
      saveCategorySelection,
      loadDemoExpenses,
      deleteDemoData,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error('useAppData deve ficar dentro de AppDataProvider.');
  }
  return value;
}
