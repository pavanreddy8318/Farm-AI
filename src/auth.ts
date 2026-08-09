export const getAuthToken = () => {
  try {
    return localStorage.getItem('farmai_jwt');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem('farmai_jwt', token);
    } else {
      localStorage.removeItem('farmai_jwt');
    }
  } catch {
    // Ignore browser storage issues during local development.
  }
};

export const clearAuthToken = () => {
  setAuthToken(null);
};

export const getFirebaseIdToken = () => {
  try {
    return localStorage.getItem('farmai_firebase_id_token');
  } catch {
    return null;
  }
};

export const setFirebaseIdToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem('farmai_firebase_id_token', token);
    } else {
      localStorage.removeItem('farmai_firebase_id_token');
    }
  } catch {
    // Ignore browser storage issues during local development.
  }
};

export const withAuthHeaders = (headers: Record<string, string> = {}) => {
  const firebaseToken = getFirebaseIdToken();
  const sessionToken = getAuthToken();
  const token = firebaseToken || sessionToken;

  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`
    };
  }

  return headers;
};
