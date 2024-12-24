import React, {useRef, useState} from 'react';
import {
  Linking,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from 'react-native';
import WebView from 'react-native-webview';

export default function AppManagerChild({navigation, route}) {
  const linkRefresh = route.params.data;

  const webViewRef = useRef(null);

  const [isTwoClick, setTwoClick] = useState(false);

  const redirectDomens = ['https://ninecasino.life/#deposit'];

  const openInBrowser = [
    'mailto:',
    'itms-appss://',
    'https://m.facebook.com/',
    'https://www.facebook.com/',
    'https://www.instagram.com/',
    'https://twitter.com/',
    'https://www.whatsapp.com/',
    'https://t.me/',
    'fb://',
    'conexus://',
    'bmoolbb://',
    'cibcbanking://',
    'bncmobile://',
    'rbcmobile://',
    'scotiabank://',
    'pcfbanking://',
    'tdct://',
    'nl.abnamro.deeplink.psd2.consent://',
    'nl-snsbank-sign://',
    'nl-asnbank-sign://',
    'triodosmobilebanking',
    'wise',
    'skrill',
  ];

  function backHandler() {
    if (isTwoClick) {
      navigation.goBack();
      return;
    }
    setTwoClick(true);
    webViewRef.current.goBack();
    setTimeout(() => {
      setTwoClick(false);
    }, 1000);
  }

  const checkLinkInArray = (link, array) => {
    for (let i = 0; i < array.length; i++) {
      if (link.includes(array[i])) {
        return true;
      }
    }
    return false;
  };

  const onShouldStartLoadWithRequest = event => {
    if (checkLinkInArray(event.url, openInBrowser)) {
      try {
        Linking.openURL(event.url);
      } catch (error) {
        Alert.alert('Ooops', 'It seems you don\'t have the bank app installed, wait for a redirect to the payment page');
      }
      return false;
    }

    if (checkLinkInArray(event.mainDocumentURL, redirectDomens)) {
      navigation.navigate('main');
      return false;
    }
    return true;
  };

  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
        <StatusBar barStyle={'light-content'} />
        <WebView
          originWhitelist={[
            '*',
            'http://*',
            'https://*',
            'intent://*',
            'tel:*',
            'mailto:*',
          ]}
          source={{uri: linkRefresh}}
          textZoom={100}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          allowsBackForwardNavigationGestures={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onError={syntEvent => {
            const {nativeEvent} = syntEvent;
            const {code} = nativeEvent;
            if (code === -1101) {
              navigation.goBack();
            }
            if (code === -1002) {
              Alert.alert('Ooops', 'It seems you don\'t have the bank app installed, wait for a redirect to the payment page');
              navigation.goBack();
            }
            console.log('Webview Error', nativeEvent);
          }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          allowFileAccess={true}
          showsVerticalScrollIndicator={false}
          javaScriptCanOpenWindowsAutomatically={true}
          style={{flex: 1, marginBottom: 10}}
          ref={webViewRef}
          userAgent={
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 Version/18.1'
          }
        />
      </SafeAreaView>
      <TouchableOpacity
        style={{
          width: 30,
          height: 30,
          position: 'absolute',
          bottom: 5,
          left: 25,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => {
          backHandler();
        }}>
        <Image
          source={require('./assets/_back.png')}
          style={{width: '90%', height: '90%', resizeMode: 'contain'}}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          width: 30,
          height: 30,
          position: 'absolute',
          bottom: 5,
          right: 25,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 5,
        }}
        onPress={() => {
          webViewRef.current.reload();
        }}>
        <Image
          source={require('./assets/_reload.png')}
          style={{width: '90%', height: '90%', resizeMode: 'contain'}}
        />
      </TouchableOpacity>
    </View>
  );
}
