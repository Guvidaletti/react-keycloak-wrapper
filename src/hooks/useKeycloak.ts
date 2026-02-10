import { useContext } from 'react';
import { KeycloakContext } from '../provider/keycloak-context';

export function useKeycloak(name = 'default') {
  const ctx = useContext(KeycloakContext)[name];

  if (!ctx) {
    throw new Error(`Missing config ${name}`);
  }

  return {
    login: ctx.login,
    logout: ctx.logout,
    loading: ctx.loading,
    isAuthenticated: ctx.isAuthenticated,
  };
}
