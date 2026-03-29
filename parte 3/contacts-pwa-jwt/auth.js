const ACCESS_TOKEN_KEY = "contacts_access_token";
const REFRESH_TOKEN_KEY = "contacts_refresh_token";
const API_BASE_KEY = "contacts_api_base";

export function setApiBase(url) {
  localStorage.setItem(API_BASE_KEY, url.trim());
}

export function getApiBase() {
  return localStorage.getItem(API_BASE_KEY) || "http://localhost:5013";
}

export function saveTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getAccessToken();
}
