import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/Buttons';
import Container from '../components/Container';
import Logo from '../components/Logo';
import { colors, radius, space, type } from '../theme/tokens';

const POINTS = [
  {
    icon: 'photo-camera',
    title: 'Leitura da nota',
    text: 'O texto é lido neste aparelho quando a captura está disponível.',
  },
  {
    icon: 'pie-chart',
    title: 'Organização por categoria',
    text: 'Cada gasto fica na categoria que você escolher.',
  },
  {
    icon: 'lock',
    title: '100% local',
    text: 'Seus dados ficam neste aparelho, sem conta e sem nuvem.',
  },
];

export default function Welcome({ navigation }) {
  return (
    <Container dark edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoCard}>
          <Logo />
        </View>
        <Text style={styles.lead}>Fotografe uma nota ou lance um gasto manualmente.</Text>
        {POINTS.map((point) => (
          <View key={point.title} style={styles.point}>
            <View style={styles.pointIcon}>
              <MaterialIcons name={point.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.pointCopy}>
              <Text style={styles.pointTitle}>{point.title}</Text>
              <Text style={styles.pointText}>{point.text}</Text>
            </View>
          </View>
        ))}
        <PrimaryButton
          label="Continuar"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
        />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.welcome,
  },
  content: {
    paddingVertical: space.xxl,
  },
  logoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: space.xl,
  },
  lead: {
    ...type.body,
    color: '#D7E4DF',
    textAlign: 'center',
    marginBottom: space.xl,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: space.lg,
  },
  pointIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.welcomeCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  pointCopy: {
    flex: 1,
  },
  pointTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  pointText: {
    color: '#D7E4DF',
    fontSize: 14,
    lineHeight: 20,
  },
});
