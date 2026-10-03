import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { categoriesData } from '../data/categories';
import { colors, radius, space } from '../theme/tokens';
import { PrimaryButton } from './Buttons';
import Card from './Card';

export default function Categories({ savedSelection, ready, loadError, onSave }) {
  const [selectedSubs, setSelectedSubs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready) setSelectedSubs(savedSelection || {});
  }, [ready, savedSelection]);

  const toggleSubcategory = (name) => {
    setSelectedSubs((current) => {
      const next = { ...current };
      if (next[name]) delete next[name];
      else next[name] = true;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await onSave(selectedSubs);
    setSaving(false);
    if (!result?.ok) {
      Alert.alert('Erro', 'Não foi possível salvar suas preferências.');
      return;
    }
    Alert.alert('Sucesso', 'Preferências salvas.');
  };

  return (
    <View>
      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
      {categoriesData.map((group) => (
        <Card key={group.title} style={styles.card}>
          <Text style={styles.group}>{group.title}</Text>
          {group.subcategories.map((name) => (
            <Pressable key={name} style={styles.row} onPress={() => toggleSubcategory(name)}>
              <Checkbox
                status={selectedSubs[name] ? 'checked' : 'unchecked'}
                onPress={() => toggleSubcategory(name)}
                color={colors.primary}
              />
              <Text style={styles.name}>{name}</Text>
            </Pressable>
          ))}
        </Card>
      ))}
      <PrimaryButton
        label={saving ? 'Salvando...' : 'Salvar preferências'}
        onPress={handleSave}
        disabled={!ready || saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md,
    paddingVertical: space.sm,
  },
  group: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: space.xs,
    paddingHorizontal: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  name: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    marginBottom: space.md,
  },
});
