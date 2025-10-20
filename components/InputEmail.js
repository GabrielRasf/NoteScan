import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

const InputLogin = () => {

  const [email, setEmail] = useState('');

  return (
    <View style={styles.view}>
      <TextInput
        style={styles.textInput}
        placeholder="E-mail"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    paddingBottom: 20,
  },
  textInput: {
    marginTop: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
  },
});

export default InputLogin;
