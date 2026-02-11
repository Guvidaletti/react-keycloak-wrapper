import { useContext } from "react";
import { KeycloakContext } from "../provider/keycloak-context";

export function useKeycloak(name = "default") {
  const ctx = useContext(KeycloakContext);

  if (!ctx) {
    throw new Error(`Missing config ${name}`);
  }

  return {
    login: ctx.login,
    logout: ctx.logout,
    isLoading: ctx.isLoading,
    isAuthenticated: ctx.isAuthenticated,
  };
}
