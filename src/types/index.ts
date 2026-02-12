import { KeycloakError } from "keycloak-js";

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  /** {domain}/realms/{realm}/
   * without the suffix ".well-known/openid-configuration"
   * @default {url}/realms/{realm}
   */
  wellKnownUrlPrefix?: string;
  redirectUri: string;
  tokenRefreshInterval?: number;
}

type UserRoles =
  | { role?: string[] }
  | { roles?: string[] }
  | { relation?: string[] }
  | { groups?: string[] };

export type KeycloakUser = {
  name: string;
  family_name: string;
  given_name: string;
  preferred_username: string;
} & UserRoles;

export interface KeycloakContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  userInfo: KeycloakUser | null;
  accessToken?: string;
  idToken?: string;
  error: Error | KeycloakError | null;
  sessionLost: boolean;

  login: (redirectUri?: string) => Promise<void>;
  logout: (redirectUri: string) => Promise<void>;
}
