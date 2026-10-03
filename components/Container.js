import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../theme/tokens';

const Container = ({ children, style, edges = ['top', 'left', 'right'], dark = false }) => (
  <SafeAreaView
    style={[styles.container, dark && styles.dark, style]}
    edges={edges}
  >
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: space.xl,
    backgroundColor: colors.background,
  },
  dark: {
    backgroundColor: colors.capture,
    maxWidth: 720,
  },
});

export default Container;
