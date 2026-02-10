import { useContext } from 'react';
import { KeycloakContext } from '../provider/keycloak-context';

export function useKeycloakToken(name = 'default') {
  const ctx = useContext(KeycloakContext)[name];

  return {
    accessToken: ctx.accessToken,
    idToken: ctx.idToken,
  };
}
