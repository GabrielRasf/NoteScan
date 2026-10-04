import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { TextAction } from '../components/Buttons';
import Container from '../components/Container';
import { colors, radius, space } from '../theme/tokens';
import { imageFromPickerResult } from '../services/capture/imageResult';
import { createId, draftFromRecognition } from '../services/expenses/expense';
import { temporaryFiles } from '../services/files/temporaryFiles';
import { OcrError } from '../services/ocr/errors';
import { recognizeText } from '../services/ocr/recognizeText';
import { showMessage } from '../services/ui/dialogs';

export default function Camera() {
  const navigation = useNavigation();
  const mounted = useRef(true);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const openReview = (draft) => {
    navigation.navigate('Review', { draft });
    if (mounted.current) {
      setLoading(false);
      setImageUri(null);
    }
  };

  const processImage = async (pickedUri) => {
    const contentId = createId();
    const adopted = temporaryFiles.adopt(pickedUri, { ownerId: contentId });
    const uri = adopted.ok ? adopted.uri : pickedUri;
    const imageTempId = adopted.ok ? adopted.id : null;
    setImageUri(uri);
    setLoading(true);

    let draft;
    try {
      const recognition = imageTempId
        ? await temporaryFiles.use(imageTempId, recognizeText)
        : await recognizeText(uri);
      draft = draftFromRecognition({ text: recognition.text, imageUri: uri, imageTempId, contentId });
    } catch (error) {
      const message =
        error instanceof OcrError
          ? error.message
          : 'Não foi possível ler o texto desta imagem.';
      draft = draftFromRecognition({
        text: '',
        imageUri: uri,
        imageTempId,
        contentId,
        notice: message,
      });
    }

    if (!mounted.current) {
      temporaryFiles.deleteForContent(contentId);
      return;
    }
    try {
      openReview(draft);
    } catch (error) {
      temporaryFiles.deleteForContent(contentId);
      throw error;
    }
  };

  const pick = async (mode) => {
    if (loading) return;

    const permission =
      mode === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showMessage(
        'Permissão necessária',
        mode === 'camera'
          ? 'Permita o uso da câmera para fotografar a nota.'
          : 'Permita o acesso às fotos para escolher uma nota.'
      );
      return;
    }

    try {
      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

      const selected = imageFromPickerResult(result);
      if (selected.status === 'canceled') return;
      if (selected.status === 'invalid') {
        showMessage('Imagem inválida', 'Não foi possível usar esta imagem.');
        return;
      }
      await processImage(selected.uri);
    } catch (error) {
      if (mounted.current) setLoading(false);
      showMessage(
        'Não foi possível abrir',
        mode === 'camera'
          ? 'Não foi possível abrir a câmera.'
          : 'Não foi possível abrir a galeria.'
      );
    }
  };

  return (
    <Container dark edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.top}>
        <PressableCircle label="Fechar" icon="close" onPress={() => navigation.goBack()} disabled={loading} />
      </View>
      <View style={styles.frame}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} accessibilityLabel="Prévia da nota" />
        ) : (
          <Text style={styles.hint}>A foto abre na câmera do aparelho e fica guardada só no NoteScan, junto do gasto. Nada é copiado para a galeria.</Text>
        )}
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Lendo a nota...</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.controls}>
        <PressableCircle label="Escolher da galeria" icon="photo-library" onPress={() => pick('gallery')} disabled={loading} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tirar foto"
          disabled={loading}
          onPress={() => pick('camera')}
          style={[styles.shutter, loading && styles.disabled]}
        >
          <View style={styles.shutterCore} />
        </Pressable>
        <View style={styles.side} />
      </View>
      <TextAction label="Preencher manualmente" onPress={() => navigation.navigate('ManualEntry')} disabled={loading} />
    </Container>
  );
}

function PressableCircle({ label, icon, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.side, disabled && styles.disabled]}
    >
      <MaterialIcons name={icon} size={24} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: space.md,
  },
  frame: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#2A3A34',
    backgroundColor: '#0C1412',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: space.lg,
  },
  hint: {
    color: '#D7E4DF',
    textAlign: 'center',
    paddingHorizontal: space.xl,
    fontSize: 15,
    lineHeight: 22,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 16, 14, 0.72)',
  },
  loadingText: {
    marginTop: space.sm,
    color: colors.white,
    fontSize: 15,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  side: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C2A26',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
