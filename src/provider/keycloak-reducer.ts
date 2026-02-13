import { KeycloakError } from "keycloak-js";
import { KeycloakContextValue, KeycloakUser } from "../types";

type GenericAction<T extends string, P = undefined> = { type: T; payload: P };

export type KeycloakAction =
  | GenericAction<
      "SET_TOKEN",
      {
        accessToken?: string;
        idToken?: string;
        refreshToken?: string;
        isAuthenticated?: boolean;
      }
    >
  | GenericAction<"SET_LOADING", boolean>
  | GenericAction<"SET_ERROR", Error | KeycloakError | null>
  | GenericAction<"SET_SESSION_LOST", boolean>
  | GenericAction<"SET_USER_INFO", KeycloakUser | null>;

export const initialKeycloakContextValue: KeycloakContextValue = {
  error: null,
  isAuthenticated: false,
  isLoading: true,
  sessionLost: false,
  login: () => Promise.reject(new Error("Not implemented")),
  logout: () => Promise.reject(new Error("Not implemented")),
  userInfo: null,
};

export function keycloakReducer(
  state: KeycloakContextValue,
  action: KeycloakAction,
): KeycloakContextValue {
  switch (action.type) {
    case "SET_TOKEN":
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        idToken: action.payload.idToken,
        isAuthenticated:
          action.payload.isAuthenticated ?? state.isAuthenticated,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error:
          !action.payload || action.payload instanceof Error
            ? action.payload
            : new Error(
                String(
                  action.payload.error || action.payload.error_description,
                ),
              ),
      };
    case "SET_SESSION_LOST":
      return {
        ...state,
        sessionLost: action.payload,
      };
    case "SET_USER_INFO":
      return {
        ...state,
        userInfo: action.payload,
      };

    default:
      return state;
  }
}
