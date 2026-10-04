import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NavBar from '../components/NavBar';
import Camera from '../pages/Camera';
import ManualEntry from '../pages/ManualEntry';
import Receipt from '../pages/Receipt';
import Review from '../pages/Review';
import Welcome from '../pages/Welcome';

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Main" component={NavBar} />
      <Stack.Screen name="Camera" component={Camera} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="ManualEntry" component={ManualEntry} />
      <Stack.Screen name="Receipt" component={Receipt} />
    </Stack.Navigator>
  );
}
