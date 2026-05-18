import { describe, expect, it } from 'vitest';
import { useAuthStore } from './auth.store';

describe('auth.store', () => {
  it('starts empty', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('persists a session', () => {
    useAuthStore.getState().setSession({
      token: 'tk',
      user: { id: '1', name: 'Ana', email: 'ana@x.com', role: 'user' },
      expiresIn: '15m',
    });
    expect(useAuthStore.getState().token).toBe('tk');
    expect(useAuthStore.getState().user?.role).toBe('user');
  });

  it('clears the session', () => {
    useAuthStore.getState().setSession({
      token: 'tk',
      user: { id: '1', name: 'Ana', email: 'ana@x.com', role: 'user' },
      expiresIn: '15m',
    });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
