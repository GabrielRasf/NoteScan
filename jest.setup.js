jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-text-extractor', () => ({
  isSupported: true,
  extractTextFromImage: jest.fn(async () => []),
}));

jest.mock('./services/dev/demoSession', () => ({
  seedDemoOnLaunch: false,
  purgeDemoOnLaunch: false,
  demoPurgeToken: 'delete',
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));
