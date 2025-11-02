// NavBar.js
import React from 'react';
import { BottomNavigation } from 'react-native-paper';
import Account from '../pages/Account';
import CameraStack from '../routes/CameraStack';
import Chart from '../pages/Chart'

const NavBar = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'account', title: 'Account', focusedIcon: 'account' },
    { key: 'camera', title: 'Camera', focusedIcon: 'camera' },
    { key: 'chartline', title: 'Chart', focusedIcon: 'chart-areaspline' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'account':
        return <Account />;
      case 'camera':
        return <CameraStack />; // stack da câmera
      case 'chartline':
        return <Chart />; // aba chart
      default:
        return null;
    }
  };

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#fff' }}
    />
  );
};

export default NavBar;
