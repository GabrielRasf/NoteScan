import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, space, type } from '../theme/tokens';
import { useAppData } from '../state/AppData';
import { PrimaryButton, TextAction } from './Buttons';
import Card from './Card';

export default function DevDemoData() {
  const { loadDemoExpenses, deleteDemoData } = useAppData();
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (action, successText) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setMessage('Não foi possível atualizar os dados de demonstração.');
      return;
    }
    setMessage(successText(result));
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Desenvolvimento</Text>
      <Text style={styles.text}>
        Gera gastos temporários para ver o resumo. O comando delete remove só esses registros e as categorias que eles marcaram.
      </Text>
      <PrimaryButton
        label="Gerar dados de demonstração"
        disabled={busy}
        onPress={() =>
          run(loadDemoExpenses, (result) =>
            result.alreadySeeded
              ? 'Os dados de demonstração já estão carregados.'
              : `${result.added} gastos de demonstração gravados.`
          )
        }
      />
      <TextAction
        label="delete"
        disabled={busy}
        onPress={() =>
          run(deleteDemoData, (result) => `${result.removed} gastos de demonstração removidos.`)
        }
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.xl,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  text: {
    ...type.muted,
    marginTop: space.sm,
  },
  message: {
    ...type.muted,
    marginTop: space.md,
    color: colors.ink,
  },
});
