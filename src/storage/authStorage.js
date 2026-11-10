import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'portal_token';
const USER_KEY = 'portal_user';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser() {
  const value = await AsyncStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function saveSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)]
  ]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY
  ]);
}