import React from 'react';
import { Pressable, Text, StyleSheet, View, Alert } from 'react-native';

const Buttons = ({ text, onSignUpPress }) => {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.buttonEnter}
        onPress={() => Alert.alert('Pressed')}>
        <Text style={styles.text}>{text}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  buttonEnter: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#002042',
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});

export default Buttons;
