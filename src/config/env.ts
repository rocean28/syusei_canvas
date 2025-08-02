const serverUrl = import.meta.env.VITE_SERVER_URL;

export const env = {
  appUrl: import.meta.env.VITE_APP_URL,
  basePath: import.meta.env.VITE_BASE_PATH,
  serverUrl,
  apiUrl: `${serverUrl}/php/api`,
  authUrl: `${serverUrl}/php/auth`,
  lockUrl: `${serverUrl}/php/lock`,

  useAuth: import.meta.env.VITE_USE_AUTH === 'true',
};