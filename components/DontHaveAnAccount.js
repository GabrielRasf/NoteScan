import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

const DontHaveAnAccount = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.dontHaveAccount}>Don't have an account? </Text>
      <Pressable onPress={onPress}>
        <Text style={[styles.dontHaveAccount, styles.onPress]}>Sign Up</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  dontHaveAccount: {
    fontSize: 14,
    color: '#000',
  },
  onPress: {
    color: '#002042',
    fontWeight: '600',
  },
});

export default DontHaveAnAccount;
