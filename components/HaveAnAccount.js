import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

const HaveAnAccount = ({ onSignInPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.dontHaveAccount}>Already have an account? </Text>
      <Pressable onPress={onSignInPress}>
        <Text style={[styles.dontHaveAccount, styles.signInText]}>Sign In</Text>
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
  signInText: {
    color: '#002042',
    fontWeight: '600',
  },
});

export default HaveAnAccount;
