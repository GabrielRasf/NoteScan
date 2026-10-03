import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Categories from '../components/Categories';
import Card from '../components/Card';
import Container from '../components/Container';
import DevDemoData from '../components/DevDemoData';
import ScreenHeader from '../components/ScreenHeader';
import { colors, space, type } from '../theme/tokens';
import { useAppData } from '../state/AppData';

export default function More() {
  const { categorySelection, categoriesReady, categoriesError, saveCategorySelection } = useAppData();

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Mais" subtitle="Preferências deste aparelho." />
        <Card style={styles.note}>
          <Text style={styles.noteTitle}>Dados neste aparelho</Text>
          <Text style={styles.noteText}>
            O NoteScan não tem conta nem servidor. Gastos e categorias ficam só neste aparelho.
          </Text>
        </Card>
        <Text style={styles.section}>Categorias</Text>
        <Text style={styles.noteText}>
          Marque as categorias que quer ver ao salvar um gasto. Gastos antigos permanecem na categoria em que foram salvos.
        </Text>
        <Categories
          savedSelection={categorySelection}
          ready={categoriesReady}
          loadError={categoriesError}
          onSave={saveCategorySelection}
        />
        {__DEV__ ? <DevDemoData /> : null}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  note: {
    marginBottom: space.xl,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: space.sm,
  },
  noteText: {
    ...type.muted,
    marginBottom: space.md,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: space.sm,
  },
});
