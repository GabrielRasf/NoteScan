import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Logo from '../components/Logo';
import Container from '../components/Container';

const screenWidth = Dimensions.get("window").width;

const pieData = [
  {
    name: 'Moradia e Utilidades',
    population: 30,
    color: '#f00',
    legendFontColor: '#7F7F7F',
    legendFontSize: 14,
  },
  {
    name: 'Transporte',
    population: 15,
    color: '#0f0',
    legendFontColor: '#7F7F7F',
    legendFontSize: 14,
  },
  {
    name: 'Alimentação',
    population: 25,
    color: '#00f',
    legendFontColor: '#7F7F7F',
    legendFontSize: 14,
  },
  {
    name: 'Saúde e Bem-estar',
    population: 10,
    color: '#ff0',
    legendFontColor: '#7F7F7F',
    legendFontSize: 14,
  },
  {
    name: 'Lazer e Entretenimento',
    population: 20,
    color: '#0ff',
    legendFontColor: '#7F7F7F',
    legendFontSize: 14,
  },
];

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  decimalPlaces: 0,
};

const Chart = () => {
  return (
    <Container>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Logo />

        <View style={styles.chartWrapper}>
          <PieChart
            data={pieData}
            width={screenWidth - 40} // margens de 20px em cada lado
            height={250}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center', // centraliza horizontalmente
  },
  chartWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
});

export default Chart;
