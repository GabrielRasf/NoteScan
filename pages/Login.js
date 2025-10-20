import React from 'react';
import { useNavigation } from '@react-navigation/native';

import Container from '../components/Container';
import Logo from '../components/Logo';
import InputLogin from '../components/InputEmail';
import InputPassword from '../components/InputPassword';
import ForgotPassword from '../components/ForgotPassword';
import Button from '../components/ButtonSignIn';
import HaveAnAccount from '../components/DontHaveAnAccount';

const Login = () => {
  const navigation = useNavigation();

  return (
    <Container>
      <Logo />
      <InputLogin />
      <InputPassword />
      <ForgotPassword />

      <Button
        text="Sign in"
        onPress={() => console.log('Sign In pressed')}
      />

      <HaveAnAccount
        onSignUpPress={() => navigation.navigate('SignUp')}
      />
    </Container>
  );
};

export default Login;
