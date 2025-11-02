import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

import Logo from '../components/Logo';
import InputEdit from '../components/InputEdit';
import Container from '../components/Container';
import Categories from '../components/Categories';

const Account = () => {
  return (
    <Container>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
      >
        <Logo />

        <InputEdit placeholder="Name" />
        <InputEdit placeholder="E-mail" />
        <InputEdit placeholder="Password" secureTextEntry />
        <Categories />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
});

export default Account;
