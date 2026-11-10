import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession
} from './storage/authStorage';

export {
  clearSession,
  getStoredUser,
  getToken,
  saveSession
};

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3000';

// Descobre automaticamente o IP do computador que está rodando o Expo,
// assim o app funciona em qualquer máquina/rede sem editar código.
// Para forçar um endereço, defina EXPO_PUBLIC_API_URL no arquivo .env.
function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${API_PORT}/api`;
  }

  // Ex.: "192.168.1.25:8081" -> "192.168.1.25"
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:${API_PORT}/api`;
  }

  // Fallback: emulador Android enxerga o PC em 10.0.2.2
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${API_PORT}/api`
    : `http://localhost:${API_PORT}/api`;
}

export const API_URL = resolveApiUrl();

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function api(path, options = {}) {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error(
      `Não foi possível conectar ao servidor (${API_URL}). Verifique se a API está rodando (npm run server) e se o celular está na mesma rede Wi-Fi.`
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    await clearSession();

    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
  }

  if (!response.ok) {
    throw new Error(data.erro || 'Não foi possível concluir a operação.');
  }

  return data;
}