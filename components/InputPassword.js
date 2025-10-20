import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

const InputLogin = () => {
  const [password, setPassword] = useState('');

  return (
    <View style={styles.view}>
      <TextInput
        style={styles.textInput}
        placeholder={"Password"}
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
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
