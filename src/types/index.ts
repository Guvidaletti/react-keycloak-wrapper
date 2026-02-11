import { KeycloakError, KeycloakUserInfo } from "keycloak-js";

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  redirectUri?: string;
  tokenRefreshInterval?: number;
}

export interface KeycloakContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  userInfo: KeycloakUserInfo | null;
  accessToken?: string;
  idToken?: string;
  error: Error | KeycloakError | null;
  sessionLost: boolean;

  login: (redirectUri?: string) => Promise<void>;
  logout: (redirectUri: string) => Promise<void>;
}
