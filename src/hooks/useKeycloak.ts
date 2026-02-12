import { useContext } from "react";
import { KeycloakContext } from "../provider/keycloak-context";

export function useKeycloak() {
  const ctx = useContext(KeycloakContext);

  return {
    login: ctx.login,
    logout: ctx.logout,
    isLoading: ctx.isLoading,
    isAuthenticated: ctx.isAuthenticated,
  };
}
