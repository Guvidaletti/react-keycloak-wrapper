import { createContext } from 'react';
import { KeycloakContextValue } from '../types';

export const KeycloakContext = createContext<
  Record<string, KeycloakContextValue>
>({});
