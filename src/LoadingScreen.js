import React, {useState} from 'react';
import {Image} from 'react-native';

export default function GameScreen() {
  const imageList = [
    require('./assets/loader1.png'),
    require('./assets/loader1.png'),
  ];

  const imageStyle = {position: 'absolute', width: '100%', height: '100%'};

  const imageRender = id => {
    return <Image source={imageList[id]} style={imageStyle} />;
  };

  const [imageID, setImageID] = useState(0);
  setTimeout(() => {
    setImageID(1);
  }, 1000);

  return imageRender(imageID);
}
