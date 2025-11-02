import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const Logo = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('../assets/images/noteScan.png')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 200,
    height: 110,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
});

export default Logo;
