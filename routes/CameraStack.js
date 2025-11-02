import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Camera from '../pages/Camera';
import TirarFoto from '../pages/TirarFoto';

const Stack = createNativeStackNavigator();

export default function CameraStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Camera" component={Camera} />
      <Stack.Screen name="TirarFoto" component={TirarFoto} />
    </Stack.Navigator>
  );
}
