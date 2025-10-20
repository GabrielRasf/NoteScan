import React from 'react';
import { View, StyleSheet } from 'react-native';

const Container = ({ children }) => (
  <View style={styles.container}>{children}</View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 25,
    paddingRight: 25,
    backgroundColor: '#fff',
    paddingVertical: 50,
  },
});

export default Container;
