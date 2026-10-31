// Demo authentication only: any non-empty username and password are accepted.
//
// To add real authentication later, replace `login` with a call to your backend
// (e.g. POST /auth/login returning a JWT) and send that token from the axios
// interceptor in services/api.js. The rest of the app only depends on `useAuth()`.
export const SESSION_KEY = 'planmyday_user';

/** Returns `{ username }` for the signed-in user, or null. */
export function getSession() {
  try {
    const username = localStorage.getItem(SESSION_KEY);
    return username ? { username } : null;
  } catch {
    return null; // storage blocked (private mode etc.)
  }
}

/** Validates the form and starts a session. Throws an Error with a friendly message. */
export function login(username, password) {
  const name = (username || '').trim();
  if (!name) throw new Error('Please enter a username.');
  if (name.length > 50) throw new Error('Username must be 50 characters or fewer.');
  if (!password) throw new Error('Please enter a password.');
  try {
    localStorage.setItem(SESSION_KEY, name);
  } catch {
    /* session lasts for this page view only */
  }
  return { username: name };
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
