import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Container from '../components/Container';
import { formatBrl } from '../services/expenses/money';
import { receiptImageUri } from '../services/receipts/receiptFiles';
import { useAppData } from '../state/AppData';
import { colors, radius, space } from '../theme/tokens';

export default function Receipt({ navigation, route }) {
  const { expenses } = useAppData();
  const [failed, setFailed] = useState(false);
  const expense = expenses.find((item) => item.id === route.params?.expenseId);
  const uri = expense ? receiptImageUri(expense.receiptImage) : null;

  return (
    <Container dark edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={() => navigation.goBack()}
          style={styles.close}
        >
          <MaterialIcons name="close" size={24} color={colors.white} />
        </Pressable>
        {expense ? (
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {expense.description || 'Sem descrição'}
            </Text>
            <Text style={styles.meta}>
              {formatBrl(expense.amount)} · {expense.date || 'Sem data'}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.frame}>
        {uri && !failed ? (
          <Image
            accessibilityLabel="Foto da nota"
            source={{ uri }}
            resizeMode="contain"
            style={styles.image}
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={styles.message}>
            {expense
              ? 'A foto desta nota não está disponível neste aparelho.'
              : 'Este gasto não está mais salvo neste aparelho.'}
          </Text>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: space.md,
  },
  close: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C2A26',
  },
  copy: {
    flex: 1,
    marginLeft: space.md,
  },
  title: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    color: '#D7E4DF',
    fontSize: 14,
    marginTop: 2,
  },
  frame: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#2A3A34',
    backgroundColor: '#0C1412',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: space.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  message: {
    color: '#D7E4DF',
    textAlign: 'center',
    paddingHorizontal: space.xl,
    fontSize: 15,
    lineHeight: 22,
  },
});
