import React from 'react'
import { Pressable, Text, StyleSheet, View } from 'react-native';

const ButtonCategories = ({ text, onPress }) => {
  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.text}>{text}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  button: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'left',
    backgroundColor: '#002042',
  },
  text: { 
    color: 'white',
    fontSize: 16,
  },
});

export default ButtonCategories