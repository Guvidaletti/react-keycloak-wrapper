import { useContext } from "react";
import { KeycloakContext } from "../provider/keycloak-context";
import { KeycloakUser } from "../types";

export function useKeycloakToken<UserType = KeycloakUser>() {
  const ctx = useContext(KeycloakContext);

  return {
    accessToken: ctx.accessToken,
    accessTokenPayload: ctx.accessTokenPayload as UserType | null,
    idToken: ctx.idToken,
  };
}
