import React, {useEffect, useRef, useState} from 'react';
import {
  Linking,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  View,
  Image,
  Text,
  Alert,
} from 'react-native';
import WebView from 'react-native-webview';

import Storage from './Storage';
import LoadingAppManager from './LoadingAppManager';
import {Link} from "@react-navigation/native";

export default function AppManagerMain({navigation}) {
  const [linkRefresh, setLinkRefresh] = useState('');

  async function getSavedParams() {
    await Storage.get('link').then(res => {
      setLinkRefresh(res);
    });
  }
  useEffect(() => {
    getSavedParams();
  }, []);

  const webViewRef = useRef(null);

  const redirectDomens = [
    'https://spin.city/payment/success?identifier=',
    'https://jokabet.com/',
    'https://winspirit.app/?identifier=',
    'https://rocketplay.com/api/payments',
    'https://ninewin.com/',
  ];

  const domensForBlock = [
    'bitcoin',
    'litecoin',
    'dogecoin',
    'tether',
    'ethereum',
    'bitcoincash',
  ];

  const checkLinkInArray = (link, array) => {
    for (let i = 0; i < array.length; i++) {
      if (link.includes(array[i])) {
        return true;
      }
    }
    return false;
  };

  const [currentURL, setCurrentURL] = useState('');
  const checkURL = useRef('');

  function checkLockedURL(url) {
    setCurrentURL(url);
    setTimeout(() => {
      if (currentURL === 'about:blank') {
        webViewRef.current.injectJavaScript(
          `window.location.replace('${linkRefresh}')`,
        );
      }
    }, 2000);
  }

  const onShouldStartLoadWithRequest = event => {
    let currentUrl = event.url;
    if (currentUrl.includes('redirect.finteqhub.com')) {
      navigation.navigate('child', {data: currentUrl});
    }

    if (
      event.mainDocumentURL.includes('pay.skrill.com') ||
      event.mainDocumentURL.includes('app.corzapay.com') ||
      event.mainDocumentURL.includes(
        'https://checkout.payop.com/en/payment/invoice-preprocessing/',
      )
    ) {
      navigation.navigate('child', {data: event.mainDocumentURL});
      webViewRef.current.injectJavaScript(
        `window.location.replace('${linkRefresh}')`,
      );
    }

    if (checkLinkInArray(currentUrl, redirectDomens)) {
      webViewRef.current.injectJavaScript(
        `window.location.replace('${linkRefresh}')`,
      );
    }

    if (checkLinkInArray(currentUrl, domensForBlock)) {
      webViewRef.current.stopLoading();
      return false;
    }
    return true;
  };

  const stateChange = navState => {
    const currentUrl = navState.url;
    checkURL.current = currentUrl;
    checkLockedURL(currentUrl);
  };

  const [isDoubleClick, setDoubleClick] = useState(false);

  const isBackClick = () => {
    if (isDoubleClick) {
      webViewRef.current.injectJavaScript(
        `window.location.replace('${linkRefresh}')`,
      );
      return;
    }
    setDoubleClick(true);
    webViewRef.current.goBack();
    setTimeout(() => setDoubleClick(false), 400);
  };

  const [isInit, setInit] = React.useState(false);
  const [isLoadingPage, setLoadingPage] = useState(true);
  const [isInvisibleLoader, setInvisibleLoader] = useState(false);

  const finishLoading = () => {
    if (!isInit) {
      setInit(true);
    } else {
      setLoadingPage(false);
      setInvisibleLoader(true);
    }
  };

  return (
    <>
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
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={stateChange}
            source={{uri: linkRefresh}}
            textZoom={100}
            allowsBackForwardNavigationGestures={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            onLoadStart={() => setLoadingPage(true)}
            onLoadEnd={() => finishLoading()}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onError={syntEvent => {
              const {nativeEvent} = syntEvent;
              const {code} = nativeEvent;
              if (code === -1002) {
                Alert.alert('Ooops', 'It seems you don\'t have the bank app installed, wait for a redirect to the payment page');
              }
            }}
            onOpenWindow={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              const {targetUrl} = nativeEvent;
              try {
                if (Linking.canOpenURL(targetUrl)) {
                  navigation.navigate('child', {data: targetUrl});
                }
              } catch (error) {}
            }}
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
          onPress={isBackClick}>
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
            setLoadingPage(true);
          }}>
          <Image
            source={require('./assets/_reload.png')}
            style={{width: '90%', height: '90%', resizeMode: 'contain'}}
          />
        </TouchableOpacity>
      </View>
      {isLoadingPage && !isInvisibleLoader ? <LoadingAppManager /> : <></>}
    </>
  );
}
