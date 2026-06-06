import { reactive } from 'vue';
import type { User } from '../types';

const TOKEN_KEY = 'micontrol.accessToken';
const USER_KEY = 'micontrol.user';

type AuthState = {
  accessToken: string;
  user: User | null;
};

function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export const authState = reactive<AuthState>({
  accessToken: localStorage.getItem(TOKEN_KEY) || '',
  user: loadUser(),
});

export function setSession(accessToken: string, user: User) {
  authState.accessToken = accessToken;
  authState.user = user;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateUser(user: User) {
  authState.user = user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  authState.accessToken = '';
  authState.user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
