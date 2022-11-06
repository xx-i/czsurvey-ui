const TOKEN_KEY = 'access_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setToken(token) {
  removeToken();
  localStorage.setItem(TOKEN_KEY, token);
}