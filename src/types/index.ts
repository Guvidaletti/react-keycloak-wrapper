import Keycloak from "keycloak-js";

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  redirectUri?: string;
  tokenRefreshInterval?: number;
}

export interface KeycloakContextValue {
  keycloak: Keycloak;
  loading: boolean;
  isAuthenticated: boolean;
  profile: Keycloak.KeycloakProfile | null;
  accessToken?: string;
  idToken?: string;
  error: Error | null;
  sessionLost: boolean;

  login: (redirectUri?: string) => Promise<void>;
  logout: (redirectUri?: string) => Promise<void>;
}
