export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  scope?: string;
  /** {domain}/realms/{realm}/
   * without the suffix ".well-known/openid-configuration"
   * @default {url}/realms/{realm}
   */
  wellKnownUrlPrefix?: string;
  /**
   * Number of seconds before the token expires to attempt automatic token refresh.
   * @default 120 (2 minutes)
   */
  refreshSecondsBeforeTokenExpires?: number;
  /**
   * URI to redirect to after login. We recommend using:
   *
   * window.location.origin + import.meta.env.BASE_URL + "/authentication"
   *
   * Dont forget to add this route to your app and show a Loader.
   */
  redirectUri: string;
  /**
   * Seconds between each check to refresh the token.
   * This is independent of the `refreshSecondsBeforeTokenExpires`
   * and only controls how often the library checks if the token needs to be refreshed.
   * @default 10
   */
  tokenRefreshIntervalInSeconds?: number;
}

export type KeycloakUser = {
  name: string;
  family_name: string;
  given_name: string;
  preferred_username: string;
  // One of them
  role?: string[];
  roles?: string[];
  relation?: string[];
  groups?: string[];
};

export interface KeycloakContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  userInfo: KeycloakUser | null;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  error: Error | null;
  sessionLost: boolean;

  login: (redirectUri?: string) => Promise<void>;
  logout: (redirectUri: string) => Promise<void>;
}
