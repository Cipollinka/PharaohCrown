import React from 'react';

import UnityView from '@azesmway/react-native-unity';
import {View} from 'react-native';

const fullScreen = {flex: 1};

const UnityComponent = () => {
  return (
    <View style={fullScreen}>
      <UnityView style={fullScreen} />
    </View>
  );
};

export default UnityComponent;
