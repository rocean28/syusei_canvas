const isDev = import.meta.env.VITE_DEV === 'true';
const serverUrl = import.meta.env.VITE_SERVER_URL;

export const env = {
  appUrl: import.meta.env.VITE_APP_URL,
  basePath: import.meta.env.VITE_BASE_PATH,
  serverUrl,
  apiUrl: isDev ? '/php/api' : `${serverUrl}/php/api`,
  authUrl: isDev ? '/php/auth' : `${serverUrl}/php/auth`,
  lockUrl: isDev ? '/php/lock' : `${serverUrl}/php/lock`,
};
