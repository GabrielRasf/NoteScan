import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { List, Checkbox, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@user_categories';

const categoriesData = [
  {
    title: 'Moradia e Utilidades',
    subcategories: [
      'Aluguel ou Financiamento',
      'Condomínio',
      'Energia',
      'Água e Saneamento',
      'Internet e Telefonia',
      'Gás',
    ],
  },
  {
    title: 'Transporte',
    subcategories: [
      'Combustível',
      'Transporte Público',
      'Manutenção do Veículo',
      'Seguro do Veículo',
      'Estacionamento e Pedágio',
    ],
  },
  {
    title: 'Alimentação',
    subcategories: [
      'Supermercado',
      'Restaurantes e Delivery',
      'Lanches e Café',
    ],
  },
  {
    title: 'Saúde e Bem-estar',
    subcategories: [
      'Plano de Saúde',
      'Medicamentos',
      'Consultas e Exames',
      'Academia',
      'Terapias',
    ],
  },
  {
    title: 'Cuidados Pessoais',
    subcategories: [
      'Higiene',
      'Beleza e Estética',
      'Roupas e Acessórios',
    ],
  },
  {
    title: 'Educação e Desenvolvimento',
    subcategories: [
      'Mensalidades e Cursos',
      'Livros e Materiais',
      'Tecnologia e Software Educacional',
    ],
  },
  {
    title: 'Lazer e Entretenimento',
    subcategories: [
      'Cinema, Shows e Eventos',
      'Viagens',
      'Esportes',
      'Streaming e Assinaturas',
    ],
  },
  {
    title: 'Financeiro',
    subcategories: [
      'Impostos e Taxas',
      'Investimentos',
      'Reserva de Emergência',
      'Seguros',
      'Tarifas Bancárias',
    ],
  },
  {
    title: 'Família e Animais',
    subcategories: [
      'Despesas com Filhos',
      'Educação Infantil',
      'Pets',
    ],
  },
  { 
    title: 'Outros',
    subcategories: ['Presentes e Doações', 'Reparos e Manutenção', 'Gastos Eventuais'],
  },
];

const savePreferences = async () => {
  try {
    const selectedOnly = Object.fromEntries(
      Object.entries(selectedSubs).filter(([_, value]) => value === true)
    );

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedOnly));
    setSelectedSubs(selectedOnly);

    Alert.alert('Sucesso', 'Preferências salvas!');
  } catch (e) {
    Alert.alert('Erro', 'Não foi possível salvar suas preferências.');
  }
};



const Categories = () => {
  const [expanded, setExpanded] = useState(null);
  const [selectedSubs, setSelectedSubs] = useState({});

  // Carregar preferências salvas
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSelectedSubs(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Erro ao carregar preferências:', e);
      }
    };
    loadPreferences();
  }, []);

  const handlePress = (title) => {
    setExpanded(expanded === title ? null : title);
  };

  const toggleSubcategory = (sub) => {
    setSelectedSubs((prev) => ({
      ...prev,
      [sub]: !prev[sub],
    }));
  };

  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSubs));
      Alert.alert('Sucesso', 'Preferências salvas!');
    } catch (e) {
      console.error('Erro ao salvar preferências:', e);
      Alert.alert('Erro', 'Não foi possível salvar suas preferências.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {categoriesData.map((cat) => (
        <List.Section key={cat.title} style={styles.section}>
          <List.Accordion
            title={cat.title}
            expanded={expanded === cat.title}
            onPress={() => handlePress(cat.title)}
            titleStyle={styles.accordionTitle}
            style={styles.accordion}
            left={(props) => <List.Icon {...props} />}>
            {cat.subcategories.map((sub) => (
              <List.Item
                key={sub}
                title={sub}
                onPress={() => toggleSubcategory(sub)}
                style={styles.subItem}
                titleStyle={styles.subTitle}
                left={(props) => (
                  <Checkbox
                    status={selectedSubs[sub] ? 'checked' : 'unchecked'}
                    onPress={() => toggleSubcategory(sub)}
                    color="#6200ee"
                  />
                )}
              />
            ))}
          </List.Accordion>
        </List.Section>
      ))}

      {/* Botão Salvar */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={savePreferences}
          buttonColor="#012042"
          textColor="#fff"
        >
          Salvar Preferências
        </Button>
      </View>
    </ScrollView>
  );
};
 
const styles = StyleSheet.create({
  // Container do ScrollView: define o fundo e padding interno
  scrollContainer: {
    backgroundColor: '#fff', 
    paddingVertical: 5, // espaço interno reduzido
  },

  section: {
    marginBottom: 12, // diminui espaço entre seções
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },

  accordion: {
    backgroundColor: '#fff',
    paddingVertical: 2, 
  },

  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingLeft: 5, 
  },

  subItem: {
    paddingVertical: 4,
    paddingHorizontal: 10, 
  },

  subTitle: {
    fontSize: 14,
    color: '#555',
    paddingLeft: 5, 
  },

  buttonContainer: {
    marginTop: 15, // espaço acima do botão
    marginBottom: 15, // espaço abaixo do botão
    alignItems: 'center', // centraliza o botão
  },
});


export default Categories;
