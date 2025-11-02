import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppRoutes from './routes/AppRoutes'; 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <NavigationContainer>
      <AppRoutes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </NavigationContainer>
  );
}
