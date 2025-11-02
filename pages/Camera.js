import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import TextRecognition from 'react-native-text-recognition';
import Container from '../components/Container';
import Logo from '../components/Logo';

const Camera = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para salvar texto em arquivo .txt
  const saveTextToFile = async (text) => {
    try {
      const fileName = `ocr_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, text, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert('Sucesso', `Arquivo salvo em: ${fileUri}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível salvar o arquivo.');
    }
  };

  // Função para processar OCR (câmera ou galeria)
  const processImage = async (uri) => {
    setImageUri(uri);
    setLoading(true);
    setRecognizedText('');

    try {
      // Salvar a imagem na galeria
      await MediaLibrary.createAssetAsync(uri);

      // OCR usando react-native-text-recognition
      const textArray = await TextRecognition.recognize(uri);
      const text = textArray.join(' ');
      setRecognizedText(text);

      // Salvar texto em arquivo .txt
      await saveTextToFile(text);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao processar a imagem.');
      setRecognizedText('Erro ao reconhecer o texto.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir câmera
  const openCamera = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPerm = await MediaLibrary.requestPermissionsAsync();

    if (!cameraPerm.granted || !mediaPerm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à câmera e à galeria.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await processImage(uri);
    }
  };

  // Abrir galeria
  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await processImage(uri);
    }
  };

  const openManualEntry = () => {
    navigation.navigate('ManualEntry');
  };

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.container}>
        <Logo />
        <TouchableOpacity style={styles.button} onPress={openCamera}>
          <MaterialIcons
            name="photo-camera"
            size={28}
            color="#000"
            style={styles.icon}
          />
          <Text style={styles.text}>Tirar Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={openGallery}>
          <MaterialIcons
            name="image"
            size={28}
            color="#000"
            style={styles.icon}
          />
          <Text style={styles.text}>Escolher foto da 
          galeria</Text>
        </TouchableOpacity>

        {/* 
        <TouchableOpacity style={styles.button} onPress={openManualEntry}>
          <FontAwesome5 name="pen" size={24} color="#000" style={styles.icon} />
          <Text style={styles.text}>Escrever manualmente</Text>
        </TouchableOpacity>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        */}

        {loading && <ActivityIndicator size="large" color="#0000ff" />}

        {recognizedText !== '' && (
          <View style={styles.textContainer}>
            <Text style={styles.title}>Texto reconhecido:</Text>
            <Text style={styles.recognizedText}>{recognizedText}</Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

export default Camera;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    width: '80%',
    justifyContent: 'flex-start', 
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 25,
  },
  icon: {
    marginRight: 15,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  textContainer: {
    padding: 15,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  recognizedText: {
    fontSize: 14,
    marginTop: 10,
  },
});
