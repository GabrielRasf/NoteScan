import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

const WeSentYouACode = () => {
  return (
    <View>
      <Text style={styles.verification}>Verification</Text>
      <Text style={styles.wesentyou}>We sent you a code to your e-mail</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  verification: {
    fontSize: 36
  },
  wesentyou: {
    fontSize: 18
  }
})

export default WeSentYouACode;
