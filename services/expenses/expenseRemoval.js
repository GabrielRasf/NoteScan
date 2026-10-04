import { temporaryFiles } from '../files/temporaryFiles';
import { deleteReceiptImage } from '../receipts/receiptFiles';
import { listExpenses, removeExpense } from '../storage/expensesStore';

// Remove o registro primeiro: se um arquivo falhar depois, ele vira resto a limpar, nunca um gasto apontando para foto apagada.
export async function deleteExpenseAndFiles(id, { temporary = temporaryFiles } = {}) {
  const before = await listExpenses();
  if (!before.ok) return { ok: false, value: before.value };
  const target = before.value.find((item) => item.id === id);

  const removed = await removeExpense(id);
  if (!removed.ok) return { ok: false, value: removed.value };

  const receipt = deleteReceiptImage(target?.receiptImage);
  const temporaryResult = temporary.deleteForContent(id);
  if (temporaryResult.deferred > 0) temporary.cleanup();

  return {
    ok: true,
    value: removed.value,
    receiptDeleted: receipt.ok,
    temporary: temporaryResult,
  };
}
