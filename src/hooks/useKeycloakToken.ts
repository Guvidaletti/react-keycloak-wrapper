import { useContext } from "react";
import { KeycloakContext } from "../provider/keycloak-context";

export function useKeycloakToken() {
  const ctx = useContext(KeycloakContext);

  return {
    accessToken: ctx.accessToken,
    idToken: ctx.idToken,
  };
}
