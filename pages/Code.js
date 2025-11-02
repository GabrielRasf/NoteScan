import React from 'react';
import { useNavigation } from '@react-navigation/native';
import Container from '../components/Container';
import Logo from '../components/Logo';
import InputCode from '../components/InputCode'
import ButtonSendCode from '../components/ButtonGetCode'
import WeSentYouACode from '../components/WeSentYouACode'

const Code = () => {
  const navigation = useNavigation();

  return (
    <Container>
      <Logo />
      <WeSentYouACode />
      <InputCode />
      <ButtonSendCode text='Send Code'/>
    </Container>
  );
};

export default Code;

