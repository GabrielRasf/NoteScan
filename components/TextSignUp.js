import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';

const TextSignUp = ({ text, linkText, onPress }) => {
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      <Pressable onPress={onPress}>
        <Text style={[styles.text, styles.link]}>{linkText}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  text: {
    textAlign: 'right',
    justifyContent: 'right',
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
    color: '#002042',
  },
});

export default TextSignUp;
