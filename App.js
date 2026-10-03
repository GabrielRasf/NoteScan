import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import AppRoutes from './routes/AppRoutes';
import { AppDataProvider } from './state/AppData';

const safeAreaMetrics = initialWindowMetrics ?? {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <PaperProvider>
        <AppDataProvider>
          <NavigationContainer>
            <AppRoutes />
          </NavigationContainer>
        </AppDataProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
