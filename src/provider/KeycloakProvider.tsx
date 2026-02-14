import Keycloak from "keycloak-js";
import React, {
  FC,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useReducer,
} from "react";
import Logger from "../components/Logger";
import ConfigurationStore from "../store/ConfigurationStore";
import { KeycloakConfig, KeycloakUser } from "../types";
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

let keycloak: Keycloak | undefined;
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

  const [state, dispatch] = useReducer(
    keycloakReducer,
    initialKeycloakContextValue,
  );

  const initiateKeycloak = useCallback(() => {
    if (!keycloak) {
      keycloak = new Keycloak({
        url: config.url,
        realm: config.realm,
        clientId: config.clientId,
        oidcProvider: config.wellKnownUrlPrefix,
      });
    }

    if (keycloak && !keycloak.didInitialize) {
      keycloak
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
    }

    keycloak.onReady = (authenticated) => {
      logger.log("Keycloak is ready", { authenticated });

      if (!authenticated) {
        dispatch({
          type: "SET_LOADING",
          payload: false,
        });
      }
    };

    keycloak.onAuthSuccess = () => {
      logger.log("Authentication successful");

      ConfigurationStore.setConfiguration(configurationName, config.realm, {
        token: keycloak?.token,
        refreshToken: keycloak?.refreshToken,
        idToken: keycloak?.idToken,
      });

      dispatch({
        type: "SET_TOKEN",
        payload: {
          isAuthenticated: true,
          accessToken: keycloak?.token,
          refreshToken: keycloak?.refreshToken,
          idToken: keycloak?.idToken,
        },
      });

      logger.log("Loading user info");
      keycloak
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

      setInterval(
        () => {
          keycloak
            ?.updateToken(config.refreshSecondsBeforeTokenExpires ?? 120)
            .then((refreshed) => {
              if (!refreshed) {
                logger.log(
                  "Token is still valid, no need to refresh",
                  new Date(
                    (keycloak?.tokenParsed?.exp ?? 0) * 1000,
                  ).toLocaleTimeString(),
                );
              }
            });
        },
        (config.tokenRefreshIntervalInSeconds ?? 10) * 1000,
      );
    };

    keycloak.onAuthLogout = () => {
      logger.log("Session lost");
      dispatch({
        type: "SET_SESSION_LOST",
        payload: true,
      });
    };

    keycloak.onAuthError = (error) => {
      logger.log("Authentication error", { error });

      dispatch({
        type: "SET_ERROR",
        payload: error || null,
      });
    };

    keycloak.onAuthRefreshError = () => {
      logger.log("Token refresh error");

      dispatch({
        type: "SET_ERROR",
        payload: new Error("Token refresh error") || null,
      });
    };

    keycloak.onAuthRefreshSuccess = () => {
      logger.log("Token refresh successful", keycloak?.token);

      ConfigurationStore.setConfiguration(configurationName, config.realm, {
        token: keycloak?.token,
        refreshToken: keycloak?.refreshToken,
        idToken: keycloak?.idToken,
      });

      dispatch({
        type: "SET_TOKEN",
        payload: {
          isAuthenticated: true,
          accessToken: keycloak?.token,
          refreshToken: keycloak?.refreshToken,
          idToken: keycloak?.idToken,
        },
      });
    };
  }, [
    config.clientId,
    config.realm,
    config.refreshSecondsBeforeTokenExpires,
    config.scope,
    config.tokenRefreshIntervalInSeconds,
    config.url,
    config.wellKnownUrlPrefix,
    configurationName,
    logging,
  ]);

  useLayoutEffect(() => {
    initiateKeycloak();
  }, [initiateKeycloak]);

  useLayoutEffect(() => {
    if (
      !state.isLoading &&
      state.isAuthenticated &&
      config.redirectUri &&
      window.location.href.startsWith(config.redirectUri)
    ) {
      const returnUrl = sessionStorage.getItem("keycloak_return_url") || "/";
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
        window.dispatchEvent(new PopStateEvent("popstate"));
        sessionStorage.removeItem("keycloak_return_url");
      }
    }
  }, [config.redirectUri, state.isAuthenticated, state.isLoading]);

  const handleLogin = useCallback(
    (redirectUri?: string) => {
      dispatch({
        type: "SET_LOADING",
        payload: true,
      });

      return (
        keycloak?.login({
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
        keycloak?.logout({
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
