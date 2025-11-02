import React from 'react';
import { View, StyleSheet } from 'react-native';
import InputsProfile from '../components/InputsProfile'

const Profile = () => {
  return (
    <View style={styles.profile}>
      <InputsProfile label="Name"/>
    </View>
  );
};

const styles = StyleSheet.create({  
  profile: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', 
  }
})

export default Profile;
