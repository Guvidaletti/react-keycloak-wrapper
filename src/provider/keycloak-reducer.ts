import { KeycloakContextValue } from '../types';

export type KeycloakState = Record<string, KeycloakContextValue>;

export type KeycloakAction = 
  | { type: 'SET_KEYCLOAK'; payload: { configurationName: string; value: KeycloakContextValue } }
  | { type: 'UPDATE_KEYCLOAK'; payload: { configurationName: string; value: Partial<KeycloakContextValue> } }
  | { type: 'SET_ERROR'; payload: { configurationName: string; error: Error | null } }
  | { type: 'SET_SESSION_LOST'; payload: { configurationName: string; sessionLost: boolean } };

export const initialKeycloakState: KeycloakState = {};

export function keycloakReducer(
  state: KeycloakState,
  action: KeycloakAction
): KeycloakState {
  switch (action.type) {
    case 'SET_KEYCLOAK':
      return {
        ...state,
        [action.payload.configurationName]: action.payload.value,
      };
    
    case 'UPDATE_KEYCLOAK':
      return {
        ...state,
        [action.payload.configurationName]: {
          ...state[action.payload.configurationName],
          ...action.payload.value,
        },
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        [action.payload.configurationName]: {
          ...state[action.payload.configurationName],
          error: action.payload.error,
        },
      };
    
    case 'SET_SESSION_LOST':
      return {
        ...state,
        [action.payload.configurationName]: {
          ...state[action.payload.configurationName],
          sessionLost: action.payload.sessionLost,
        },
      };
    
    default:
      return state;
  }
}
