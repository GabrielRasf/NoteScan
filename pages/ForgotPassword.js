import React from 'react';
import { useNavigation } from '@react-navigation/native'

import Container from '../components/Container';
import Logo from '../components/Logo';
import InputEmail from '../components/InputEmail';
import RememberYourPass from '../components/RememberYourPass'
import Button from '../components/ButtonGetCode'


const ForgotPassword = () => {

  const navigation = useNavigation()

  return (
    <Container>
      <Logo />
      <InputEmail />
      <Button 
        text="Get Code"
        onPress={() => navigation.navigate('Code')}
      />
      <RememberYourPass 
        onPress={() => navigation.navigate('Login')}
      />
    </Container> 
  );
};

export default ForgotPassword;
