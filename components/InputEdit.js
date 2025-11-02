import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

const InputEdit = ({ placeholder, value, onChangeText, secureTextEntry }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />

      <IconButton
        icon="pencil"
        size={22}
        mode="contained-tonal"
        onPress={() => console.log(`Edit ${placeholder}`)}
        style={styles.icon}
        iconColor="#000"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 10,
    minHeight: 50, 
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  icon: {
    backgroundColor: 'transparent',
    marginLeft: 5,
  },
});

export default InputEdit;
