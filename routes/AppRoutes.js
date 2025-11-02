import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import NavBar from '../components/NavBar';
import Code from '../pages/Code';
import Camera from '../pages/Camera';
import TirarFoto from '../pages/TirarFoto';

const Stack = createNativeStackNavigator();

const AppRoutes = ({ isLoggedIn, setIsLoggedIn }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login">
            {() => <Login onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>

          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="Code" component={Code} />
        </>
      ) : (
        <>
          <Stack.Screen name="NavBar" component={NavBar} />
          <Stack.Screen name="Camera" component={Camera} />
          <Stack.Screen name="TirarFoto" component={TirarFoto} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppRoutes;
