import React, { useRef } from 'react';
import { View, StyleSheet, TextInput, Text } from 'react-native';

const InputCode = () => {
  const input1 = useRef(null);
  const input2 = useRef(null);
  const input3 = useRef(null);
  const input4 = useRef(null);

  const handleChange = (text, nextInput) => {
    if (text && nextInput) {
      nextInput.current.focus();
    }
  };

  return (
    <View style={styles.container}>

      <TextInput
        ref={input1}
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => handleChange(text, input2)}
      />
      <TextInput
        ref={input2}
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => handleChange(text, input3)}
      />
      <TextInput
        ref={input3}
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => handleChange(text, input4)}
      />
      <TextInput
        ref={input4}
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => {
          if (text) input4.current.blur();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    alignSelf: 'center',
    marginTop: 20,
  },
  inputCode: {
    height: 55,
    width: 55,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
  },
});

export default InputCode;
