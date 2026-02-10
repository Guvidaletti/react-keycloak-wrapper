import { useContext } from "react";
import { KeycloakContext } from "../provider/keycloak-context";

export function useKeycloakUser(name = "default") {
  const ctx = useContext(KeycloakContext)[name];

  return {
    user: ctx?.profile,
    loading: ctx?.loading,
  };
}
