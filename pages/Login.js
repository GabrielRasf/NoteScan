import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Container from '../components/Container';
import Logo from '../components/Logo';
import InputLogin from '../components/InputEmail';
import InputPassword from '../components/InputPassword';
import ForgotPassword from '../components/ForgotPassword';
import Button from '../components/ButtonSignIn';
import HaveAnAccount from '../components/DontHaveAnAccount';

const Login = ({ onLogin }) => {
  const navigation = useNavigation();

  return (
    <Container>
      <Logo />
      <InputLogin />
      <InputPassword />
      <ForgotPassword 
        onPress={() => navigation.navigate ('ForgotPassword')}
      />

      <Button
        text="Sign in"
        onPress={() => { navigation.navigate('Home')
          onLogin();
        }}
      />

      <HaveAnAccount
        onPress={() => navigation.navigate('SignUp')}
      />
    </Container>
  );
};

export default Login;
