import React from 'react';
import { useNavigation } from '@react-navigation/native'
import Container from '../components/Container';
import Logo from '../components/Logo';
import InputEmail from '../components/InputEmail';
import InputPassword from '../components/InputPassword';
import Button from '../components/ButtonCreateAnAccount'
import InputName from '../components/InputName';
import HaveAnAccount from '../components/HaveAnAccount'

const SignUp = () => {

  const navigation = useNavigation()

  return (
    <Container>
      <Logo />
      <InputName />
      <InputEmail />
      <InputPassword />
      <InputPassword />
      <Button 
        text="Create an Account"
        onPress={() => console.log('Click')}
      />
      <HaveAnAccount 
        onSignInPress={() => navigation.navigate('Login')}
      />
    </Container>
  );
};

export default SignUp;
