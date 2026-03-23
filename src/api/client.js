import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const COOKIE_KEY = 'session_cookie';

const API_BASE_URL = 'http://10.173.40.198:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Browser requires credentials mode for cookie-based auth.
  withCredentials: true,
});

// REQUEST INTERCEPTOR
// Reads stored session cookie and injects it as the Cookie header on every request.
apiClient.interceptors.request.use(async (config) => {
  if (Platform.OS === 'web') {
    return config;
  }

  const cookie = await AsyncStorage.getItem(COOKIE_KEY);
  if (cookie) {
    config.headers['Cookie'] = cookie;
  }
  return config;
});

// RESPONSE INTERCEPTOR
// Checks for Set-Cookie header on every response.
// Extracts just the name=value portion (drops Path, HttpOnly, SameSite flags)
// and stores it in AsyncStorage for future requests.
apiClient.interceptors.response.use(
  async (response) => {
    if (Platform.OS === 'web') {
      return response;
    }

    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const raw = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader;
      const cookieValue = raw.split(';')[0].trim();
      await AsyncStorage.setItem(COOKIE_KEY, cookieValue);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
export { COOKIE_KEY };
