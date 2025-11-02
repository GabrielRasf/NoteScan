import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ForgotPassword = () => {
  const navigation = useNavigation();
  return (
    <Pressable
      style={styles.buttonForgot}
      onPress={() => navigation.navigate('ForgotPassword')}>
      <Text style={styles.forgotPassword}>Forgot Password</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  forgotPassword: {
    textAlign: 'right',
    color: '#002042',
    fontWeight: '500',
  },
  buttonForgot: {
    marginTop: 10,
  },
});

export default ForgotPassword;
