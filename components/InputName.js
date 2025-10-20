import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

const InputLogin = () => {

  const [name, setName] = useState('');

  return (
    <View style={styles.view}>
      <TextInput
        style={styles.textInput}
        placeholder="Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
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
