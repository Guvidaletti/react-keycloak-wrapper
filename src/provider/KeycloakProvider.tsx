import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import Keycloak from "keycloak-js";
import { KeycloakContext } from "./keycloak-context";
import { KeycloakConfig } from "../types";
import { keycloakReducer, initialKeycloakState } from "./keycloak-reducer";

interface Props {
  children: ReactNode;
  config: KeycloakConfig;
  configurationName?: string;
  LoadingComponent?: FC<{ opened: boolean }>;
  AuthenticatingErrorComponent?: FC<{ error: Error | null; retry: () => void }>;
  SessionLostComponent?: FC<{ retry: () => void }>;
}

export const KeycloakProvider: React.FC<Props> = ({
  children,
  config,
  configurationName = "default",
  LoadingComponent,
  AuthenticatingErrorComponent,
  SessionLostComponent,
}) => {
  const [store, dispatch] = useReducer(keycloakReducer, initialKeycloakState);
  const loadingRef = useRef<string[]>([]);

  const handleRetryError = () => {
    dispatch({
      type: "SET_ERROR",
      payload: {
        configurationName,
        error: null,
      },
    });
  };

  const handleRetrySessionLost = () => {
    dispatch({
      type: "SET_SESSION_LOST",
      payload: {
        configurationName,
        sessionLost: false,
      },
    });
  };

  const initKeycloak = useCallback(async () => {
    const keycloak = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });

    if (loadingRef.current.includes(configurationName)) {
      return;
    }

    try {
      loadingRef.current.push(configurationName);
      const isAuthenticated = await keycloak.init({
        onLoad: "check-sso",
        checkLoginIframe: false,
      });

      const profile = isAuthenticated ? await keycloak.loadUserProfile() : null;

      // 🔁 AUTO REFRESH
      if (isAuthenticated) {
        const interval = config.tokenRefreshInterval ?? 10000;

        setInterval(() => {
          keycloak.updateToken(30).catch(() =>
            keycloak.login({
              redirectUri: config.redirectUri,
            }),
          );
        }, interval);

        keycloak.onTokenExpired = () => {
          keycloak.updateToken(30);
        };
      }

      // ⚠️ Handler de sessão perdida
      keycloak.onAuthLogout = () => {
        dispatch({
          type: "SET_SESSION_LOST",
          payload: {
            configurationName,
            sessionLost: true,
          },
        });
      };

      dispatch({
        type: "SET_KEYCLOAK",
        payload: {
          configurationName,
          value: {
            keycloak,
            loading: false,
            isAuthenticated: isAuthenticated,
            profile,
            accessToken: keycloak.token,
            idToken: keycloak.idToken,
            error: null,
            sessionLost: false,

            login: (redirectUri?: string) =>
              keycloak.login({
                redirectUri: redirectUri ?? config.redirectUri,
              }),

            logout: (redirectUri?: string) =>
              keycloak.logout({
                redirectUri: redirectUri ?? config.redirectUri,
              }),
          },
        },
      });

      if (
        isAuthenticated &&
        config.redirectUri &&
        window.location.href.startsWith(config.redirectUri)
      ) {
        const returnUrl = sessionStorage.getItem("keycloak_return_url") || "/";
        // Redireciona para a URL original
        window.location.replace(returnUrl);
        sessionStorage.removeItem("keycloak_return_url");
      }

      loadingRef.current = loadingRef.current.filter(
        (name) => name !== configurationName,
      );
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          configurationName,
          error: err instanceof Error ? err : new Error(String(err)),
        },
      });
    }
  }, []);

  useEffect(() => {
    initKeycloak();
  }, []);

  const shouldRenderChildren =
    !loadingRef.current.includes(configurationName) &&
    !store[configurationName]?.loading &&
    !store[configurationName]?.error &&
    !store[configurationName]?.sessionLost &&
    !!store[configurationName]?.keycloak;

  return (
    <KeycloakContext.Provider value={store}>
      {shouldRenderChildren && children}
      {LoadingComponent && (
        <LoadingComponent opened={store[configurationName]?.loading} />
      )}
      {AuthenticatingErrorComponent && store[configurationName]?.error && (
        <AuthenticatingErrorComponent
          error={store[configurationName]?.error}
          retry={handleRetryError}
        />
      )}
      {SessionLostComponent && store[configurationName]?.sessionLost && (
        <SessionLostComponent retry={handleRetrySessionLost} />
      )}
    </KeycloakContext.Provider>
  );
};
