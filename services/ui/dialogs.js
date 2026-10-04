import { Alert, Platform } from 'react-native';

function webText(title, message) {
  return message ? `${title}\n\n${message}` : title;
}

// No react-native-web, Alert.alert é uma função vazia.
export function showMessage(title, message) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(webText(title, message));
    return;
  }
  Alert.alert(title, message);
}

export function confirmAction({ title, message, confirmLabel, onConfirm }) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(webText(title, message))) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
