import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Container = ({ children, style }) => (
  <SafeAreaView style={[styles.container, style]} edges={['top', 'left', 'right']}>
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    paddingVertical: 5,
  },
});

export default Container;
