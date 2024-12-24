import AsyncStorage from '@react-native-async-storage/async-storage';

export default class Storage {
  static async save(key, value) {
    try {
      await AsyncStorage.setItem(key, '' + value);
    } catch (error) {}
  }

  static async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return value;
      }
    } catch (error) {}
    return null;
  }
}
