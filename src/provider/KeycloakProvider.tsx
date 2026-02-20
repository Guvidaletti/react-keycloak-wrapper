import Keycloak from "keycloak-js";
import React, {
  FC,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useReducer,
  useRef,
} from "react";
import Logger from "../components/Logger";
import ConfigurationStore from "../store/ConfigurationStore";
import { KeycloakConfig, KeycloakUser } from "../types";
import { getSessionStoragePrefixCN } from "../utils/constants";
import { KeycloakContext } from "./keycloak-context";
import {
  initialKeycloakContextValue,
  keycloakReducer,
} from "./keycloak-reducer";

interface Props {
  configurationName?: string;
  logging?: "wrapper" | "keycloak" | "both";
  children: ReactNode;
  config: KeycloakConfig;
  LoadingComponent?: FC<{ opened: boolean }>;
  AuthenticatingErrorComponent?: FC<{
    error: Error | null;
  }>;
  SessionLostComponent?: FC;
}

const logger = new Logger(false);
export const KeycloakProvider: React.FC<Props> = ({
  configurationName = "default",
  logging,
  children,
  config,
  LoadingComponent,
  AuthenticatingErrorComponent,
  SessionLostComponent,
}) => {
  logger.setEnabled(["wrapper", "both"].includes(logging ?? ""));

  const keycloakRef = useRef<Keycloak>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [state, dispatch] = useReducer(
    keycloakReducer,
    initialKeycloakContextValue,
  );

  const watchKeycloakEvents = useCallback(() => {
    if (!keycloakRef.current) return;

    keycloakRef.current.onReady = (authenticated) => {
      logger.log("Keycloak is ready", { authenticated });

      if (!authenticated) {
        dispatch({
          type: "SET_LOADING",
          payload: false,
        });
      }
    };

    keycloakRef.current.onAuthSuccess = () => {
      logger.log("Authentication successful");

      ConfigurationStore.setConfiguration(configurationName, config.realm, {
        token: keycloakRef.current?.token,
        refreshToken: keycloakRef.current?.refreshToken,
        idToken: keycloakRef.current?.idToken,
      });

      dispatch({
        type: "SET_TOKEN",
        payload: {
          isAuthenticated: true,
          accessToken: keycloakRef.current?.token,
          refreshToken: keycloakRef.current?.refreshToken,
          idToken: keycloakRef.current?.idToken,
        },
      });

      logger.log("Loading user info");
      keycloakRef.current
        ?.loadUserInfo()
        .then((userInfo) => {
          logger.log("User info loaded", { userInfo });
          dispatch({
            type: "SET_USER_INFO",
            payload: userInfo as unknown as KeycloakUser,
          });
        })
        .finally(() => {
          dispatch({
            type: "SET_LOADING",
            payload: false,
          });
        });

      timeoutRef.current = setInterval(
        () => {
          keycloakRef.current
            ?.updateToken(config.refreshSecondsBeforeTokenExpires ?? 120)
            .then((refreshed) => {
              if (!refreshed) {
                logger.log(
                  "Token is still valid, no need to refresh",
                  new Date(
                    (keycloakRef.current?.tokenParsed?.exp ?? 0) * 1000,
                  ).toLocaleTimeString(),
                );
              }
            });
        },
        (config.tokenRefreshIntervalInSeconds ?? 10) * 1000,
      );
    };

    keycloakRef.current.onAuthLogout = () => {
      logger.log("Session lost");
      dispatch({
        type: "SET_SESSION_LOST",
        payload: true,
      });
    };

    keycloakRef.current.onAuthError = (error) => {
      logger.log("Authentication error", { error });

      dispatch({
        type: "SET_ERROR",
        payload: error || null,
      });
    };

    keycloakRef.current.onAuthRefreshError = () => {
      logger.log("Token refresh error");

      dispatch({
        type: "SET_ERROR",
        payload: new Error("Token refresh error") || null,
      });
    };

    keycloakRef.current.onAuthRefreshSuccess = () => {
      logger.log("Token refresh successful", keycloakRef.current?.token);

      ConfigurationStore.setConfiguration(configurationName, config.realm, {
        token: keycloakRef.current?.token,
        refreshToken: keycloakRef.current?.refreshToken,
        idToken: keycloakRef.current?.idToken,
      });

      dispatch({
        type: "SET_TOKEN",
        payload: {
          isAuthenticated: true,
          accessToken: keycloakRef.current?.token,
          refreshToken: keycloakRef.current?.refreshToken,
          idToken: keycloakRef.current?.idToken,
        },
      });
    };
  }, [
    config.realm,
    config.refreshSecondsBeforeTokenExpires,
    config.tokenRefreshIntervalInSeconds,
    configurationName,
  ]);

  const initiateKeycloak = useCallback(() => {
    if (keycloakRef.current && !keycloakRef.current.didInitialize) {
      keycloakRef.current
        .init({
          onLoad: "check-sso",
          checkLoginIframe: false,
          scope: config.scope,
          enableLogging: ["keycloak", "both"].includes(logging ?? ""),
          ...ConfigurationStore.getConfiguration(
            configurationName,
            config.realm,
          ),
        })
        .catch((error) => {
          logger.log("Failed to initialize Keycloak", { error });
          dispatch({
            type: "SET_ERROR",
            payload: error || null,
          });
          dispatch({
            type: "SET_LOADING",
            payload: false,
          });
        });
    } else if (!keycloakRef.current) {
      keycloakRef.current = new Keycloak({
        url: config.url,
        realm: config.realm,
        clientId: config.clientId,
        oidcProvider: config.wellKnownUrlPrefix,
      });

      watchKeycloakEvents();

      dispatch({
        type: "SET_CONFIGURATION_NAME",
        payload: configurationName,
      });

      return true;
    }
  }, [
    config.clientId,
    config.realm,
    config.scope,
    config.url,
    config.wellKnownUrlPrefix,
    configurationName,
    logging,
    watchKeycloakEvents,
  ]);

  useLayoutEffect(() => {
    initiateKeycloak();

    return () => {
      if (
        keycloakRef.current?.didInitialize &&
        keycloakRef.current.authenticated &&
        timeoutRef.current !== undefined
      ) {
        logger.log("Cleaning up Keycloak refresh token");
        clearInterval(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [initiateKeycloak]);

  useLayoutEffect(() => {
    if (
      !state.isLoading &&
      state.isAuthenticated &&
      config.redirectUri &&
      window.location.href.startsWith(config.redirectUri)
    ) {
      const returnUrl =
        sessionStorage.getItem(
          getSessionStoragePrefixCN(configurationName, "return_url"),
        ) || "/";
      if (!window.location.href.endsWith(returnUrl)) {
        logger.log("Redirecionando para a URL original após autenticação", {
          returnUrl,
          origin: window.location.origin,
        });

        // Redireciona para a URL original
        window.history.replaceState(
          { keycloak_redirected: true },
          "",
          window.location.origin + returnUrl,
        );
        
        // Dispara um evento para que o ReactRouter detecte
        window.dispatchEvent(new PopStateEvent("popstate"));
        sessionStorage.removeItem(
          getSessionStoragePrefixCN(configurationName, "return_url"),
        );
      }
    }
  }, [
    config.redirectUri,
    configurationName,
    state.isAuthenticated,
    state.isLoading,
  ]);

  const handleLogin = useCallback(
    (redirectUri?: string) => {
      dispatch({
        type: "SET_LOADING",
        payload: true,
      });

      return (
        keycloakRef.current?.login({
          redirectUri: redirectUri ?? config.redirectUri,
        }) ?? Promise.reject()
      );
    },
    [config.redirectUri],
  );

  const handleLogout = useCallback(
    (redirectUriAfterLogout: string) => {
      dispatch({
        type: "SET_LOADING",
        payload: true,
      });

      ConfigurationStore.clearConfiguration(configurationName, config.realm);

      return (
        keycloakRef.current?.logout({
          redirectUri: redirectUriAfterLogout,
        }) ?? Promise.reject()
      );
    },
    [config.realm, configurationName],
  );

  // carregando > erro > sessão perdida > children

  const shouldRenderError =
    state?.error && !state.isLoading && AuthenticatingErrorComponent;

  const shouldRenderSessionLost =
    state.sessionLost &&
    !state.isLoading &&
    !state?.error &&
    SessionLostComponent;

  const shouldRenderChildren =
    !state.isLoading && !state.error && !state.sessionLost;

  return (
    <KeycloakContext.Provider
      value={{
        ...state,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {shouldRenderChildren && children}

      {shouldRenderSessionLost && <SessionLostComponent />}

      {shouldRenderError && (
        <AuthenticatingErrorComponent error={state?.error} />
      )}

      {LoadingComponent && <LoadingComponent opened={state?.isLoading} />}
    </KeycloakContext.Provider>
  );
};
