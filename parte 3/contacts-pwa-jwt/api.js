import {
  getApiBase,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearSession,
} from "./auth.js";

async function parseJsonResponse(response) {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || JSON.stringify(data);
    throw new Error(message || `Error HTTP: ${response.status}`);
  }

  return data;
}

export async function login(username, password) {
  const response = await fetch(`${getApiBase()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await parseJsonResponse(response);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function refreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No hay refresh token disponible.");

  const response = await fetch(`${getApiBase()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  const data = await parseJsonResponse(response);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout() {
  const refresh = getRefreshToken();

  if (refresh) {
    const response = await fetch(`${getApiBase()}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!response.ok && response.status !== 204) {
      await parseJsonResponse(response);
    }
  }

  clearSession();
}

function authHeaders() {
  const token = getAccessToken();
  if (!token) throw new Error("No hay access token.");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function fetchContacts() {
  const response = await fetch(`${getApiBase()}/api/contacts`, {
    headers: authHeaders(),
  });
  return await parseJsonResponse(response);
}

export async function createContact(contact) {
  const response = await fetch(`${getApiBase()}/api/contacts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(contact),
  });
  return await parseJsonResponse(response);
}

export async function deleteContact(id) {
  const response = await fetch(`${getApiBase()}/api/contacts/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${getAccessToken()}`,
    },
  });

  if (response.status === 204) return true;
  await parseJsonResponse(response);
  return true;
}
