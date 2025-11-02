import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import Container from './Container'

const InputsProfile = ({ label, placeholder, value, onChangeText }) => {
  return (
    <Container>
    <View style={styles.view}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        style={styles.textInput}
        placeholder={placeholder || label}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
    </ Container>
  );
};
 
const styles = StyleSheet.create({ 
  view: {
    paddingBottom: 20,
    width: '100%'
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    width: '100%',
    marginTop: 5,
    padding: 15,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
  },
});

export default InputsProfile;
